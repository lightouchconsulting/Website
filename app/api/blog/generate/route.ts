import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { Octokit } from '@octokit/rest'
import Groq from 'groq-sdk'
import Parser from 'rss-parser'
import path from 'path'
import fs from 'fs'

const THEMES = [
  'Strategy', 'Management', 'Architecture', 'Development', 'Delivery', 'Risk', 'Operations'
]

function getWeekLabel(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

async function scrapeFeeds(): Promise<{ title: string; link: string; source: string; snippet: string }[]> {
  const feedsPath = path.join(process.cwd(), 'blog-generator', 'config', 'feeds.json')
  const feedsConfig = JSON.parse(fs.readFileSync(feedsPath, 'utf-8'))
  const feedUrls: string[] = feedsConfig.feeds ?? []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'Lightouch-BlogGenerator/1.0' } })

  const results = await Promise.allSettled(feedUrls.map(async (url) => {
    const feed = await parser.parseURL(url)
    const source = feed.title ?? new URL(url).hostname
    return (feed.items ?? [])
      .filter(item => !item.pubDate || new Date(item.pubDate) >= cutoff)
      .filter(item => item.title && item.link)
      .map(item => ({
        title: item.title!.trim(),
        link: item.link!.trim(),
        source,
        snippet: (item.contentSnippet ?? item.summary ?? '').slice(0, 300).trim(),
      }))
  }))

  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

async function classifyAndSynthesize(
  articles: { title: string; link: string; source: string; snippet: string }[],
  weekLabel: string
): Promise<{ theme: string; title: string; content: string; sources: { title: string; url: string; source: string }[] }[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  // Step 1: classify all articles in one prompt
  const articleList = articles.map((a, i) => `${i + 1}. "${a.title}" — ${a.snippet}`).join('\n')
  const classifyPrompt = `Classify each article into exactly one of these themes: ${THEMES.join(', ')}.
Articles:
${articleList}
Respond with JSON array only: [{"index":1,"theme":"Strategy"}, ...]`

  let classified: { theme: string; articles: typeof articles }[] = THEMES.map(t => ({ theme: t, articles: [] }))

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [{ role: 'user', content: classifyPrompt }],
      max_tokens: 1024,
      temperature: 0,
    })
    const text = res.choices[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed: { index: number; theme: string }[] = JSON.parse(jsonMatch?.[0] ?? text)
    for (const item of parsed) {
      const article = articles[item.index - 1]
      const bucket = classified.find(c => c.theme === item.theme)
      if (article && bucket) bucket.articles.push(article)
    }
  } catch (err) {
    console.warn('[generate] Classification failed, distributing evenly:', (err as Error).message)
    articles.forEach((a, i) => classified[i % THEMES.length].articles.push(a))
  }

  // Step 2: synthesize all themes in parallel with Groq
  const posts = await Promise.all(
    classified.map(async ({ theme, articles: themeArticles }) => {
      if (themeArticles.length === 0) return null

      const sourceContext = themeArticles.slice(0, 5)
        .map(a => `Title: ${a.title}\nSource: ${a.source}\nSnippet: ${a.snippet}`)
        .join('\n\n')

      const sources = themeArticles.slice(0, 5).map(a => ({ title: a.title, url: a.link, source: a.source }))

      const prompt = `You are a senior technology consultant writing for CIOs at Lightouch Consulting.

Write an original ~600-word insight article on the theme of "${theme}" for the week of ${weekLabel}.

Use these articles as context (synthesise your own insight, don't summarise):
${sourceContext}

Requirements:
- Strategic, direct, no fluff — CIO audience
- 3-4 sections with ## headings
- End with "## Your Next Step"
- Return ONLY Markdown starting with the title as a # heading`

      try {
        const res = await groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        })
        const content = res.choices[0]?.message?.content?.trim() ?? ''
        const titleMatch = content.match(/^#\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : `${theme}: Weekly Insights — ${weekLabel}`
        console.log(`[generate] Done: ${theme}`)
        return { theme, title, content, sources }
      } catch (err) {
        console.error(`[generate] Synthesis failed for ${theme}:`, (err as Error).message)
        return null
      }
    })
  )

  return posts.filter((p): p is NonNullable<typeof p> => p !== null)
}

async function runGeneration() {
  const weekLabel = getWeekLabel()
  console.log(`[generate] Starting for ${weekLabel}`)

  const articles = await scrapeFeeds()
  console.log(`[generate] Scraped ${articles.length} articles`)

  if (articles.length === 0) {
    console.log('[generate] No articles found')
    return
  }

  const posts = await classifyAndSynthesize(articles, weekLabel)
  console.log(`[generate] Synthesized ${posts.length} posts`)

  const octokit = new Octokit({ auth: process.env.GH_PAT })
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!

  await Promise.all(posts.map(async (post) => {
    const slug = `${weekLabel}-${post.theme.toLowerCase()}-insights`
    const sourcesYaml = post.sources
      .map(s => `  - title: "${s.title.replace(/"/g, '\\"')}"\n    url: ${s.url}\n    source: "${s.source.replace(/"/g, '\\"')}"`)
      .join('\n')
    const frontmatter = `---
title: "${post.title.replace(/"/g, '\\"')}"
slug: ${slug}
theme: ${post.theme}
weekLabel: ${weekLabel}
date: "${new Date().toISOString().split('T')[0]}"
status: draft
sources:
${sourcesYaml}
---

`
    const content = frontmatter + post.content
    const filePath = `content/drafts/${weekLabel}/${post.theme.toLowerCase()}.md`

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: filePath,
        message: `feat: generate draft ${post.theme} post for ${weekLabel}`,
        content: Buffer.from(content).toString('base64'),
      })
      console.log(`[generate] Committed ${filePath}`)
    } catch (err) {
      console.error(`[generate] Failed to commit ${filePath}:`, (err as Error).message)
    }
  }))

  console.log('[generate] Done.')
}

export async function POST() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  after(runGeneration())

  return NextResponse.json({ ok: true })
}
