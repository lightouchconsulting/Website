import { scrapeFeeds } from './scraper'
import { classifyArticles } from './classifier'
import { synthesizePosts } from './synthesizer'
import { Octokit } from '@octokit/rest'
import path from 'path'
import fs from 'fs'

const feedsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'feeds.json'), 'utf-8')
)
const themesConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config', 'themes.json'), 'utf-8')
)

function getWeekLabel(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  )
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

function buildFrontmatter(post: {
  title: string
  theme: string
  subThemes: string[]
  weekLabel: string
  sources: { title: string; url: string; source: string }[]
}): string {
  const slug = `${post.weekLabel}-${post.theme.toLowerCase()}-insights`
  const sourcesYaml = post.sources
    .map(s => `  - title: "${s.title.replace(/"/g, '\\"')}"\n    url: ${s.url}\n    source: "${s.source.replace(/"/g, '\\"')}"`)
    .join('\n')
  return `---
title: "${post.title.replace(/"/g, '\\"')}"
slug: ${slug}
theme: ${post.theme}
subThemes: [${post.subThemes.map(s => `"${s}"`).join(', ')}]
weekLabel: ${post.weekLabel}
date: "${new Date().toISOString().split('T')[0]}"
status: draft
sources:
${sourcesYaml}
---

`
}

async function main() {
  console.log('[generator] Starting blog generation...')
  const weekLabel = getWeekLabel()
  console.log(`[generator] Week: ${weekLabel}`)

  console.log('[generator] Scraping feeds...')
  const articles = await scrapeFeeds(feedsConfig.feeds)
  console.log(`[generator] Found ${articles.length} articles`)

  if (articles.length === 0) {
    console.log('[generator] No articles found — exiting')
    return
  }

  console.log('[generator] Classifying articles...')
  const classified = await classifyArticles(articles, themesConfig.themes)

  console.log('[generator] Synthesizing posts...')
  const posts = await synthesizePosts(classified, themesConfig.themes, weekLabel)
  console.log(`[generator] Generated ${posts.length} posts`)

  const octokit = new Octokit({ auth: process.env.GH_PAT })
  const owner = process.env.GITHUB_OWNER ?? 'lightouchconsulting'
  const repo = process.env.GITHUB_REPO ?? 'Website'

  for (const post of posts) {
    const filename = `${post.theme.toLowerCase()}.md`
    const filePath = `content/drafts/${weekLabel}/${filename}`
    const fileContent = buildFrontmatter(post) + post.content

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner, repo,
        path: filePath,
        message: `feat: generate draft ${post.theme} post for ${weekLabel}`,
        content: Buffer.from(fileContent).toString('base64'),
      })
      console.log(`[generator] Created ${filePath}`)
    } catch (err) {
      console.error(`[generator] Failed to commit ${filePath}:`, (err as Error).message)
    }
  }

  console.log('[generator] Done.')
}

main().catch(err => {
  console.error('[generator] Fatal error:', err)
  process.exit(1)
})
