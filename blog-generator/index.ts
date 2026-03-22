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
  date: string
  sources: { title: string; url: string; source: string }[]
}): string {
  const slug = `${post.date}-${post.theme.toLowerCase()}-insights`
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

const USED_URLS_PATH = 'content/.used-articles.json'

async function getUsedUrls(octokit: Octokit, owner: string, repo: string): Promise<Set<string>> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: USED_URLS_PATH })
    if (!Array.isArray(data) && data.type === 'file') {
      const urls: string[] = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
      return new Set(urls)
    }
  } catch { /* file doesn't exist yet */ }
  return new Set()
}

async function saveUsedUrls(octokit: Octokit, owner: string, repo: string, urls: Set<string>) {
  // Keep only the most recent 1000 URLs to prevent unbounded growth
  const trimmed = [...urls].slice(-1000)
  const content = JSON.stringify(trimmed, null, 2)

  let sha: string | undefined
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: USED_URLS_PATH })
    if (!Array.isArray(data) && data.type === 'file') sha = data.sha
  } catch { /* file doesn't exist yet */ }

  await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: USED_URLS_PATH,
    message: 'chore: update used article URLs',
    content: Buffer.from(content).toString('base64'),
    ...(sha ? { sha } : {}),
  })
}

async function main() {
  console.log('[generator] Starting blog generation...')
  const weekLabel = getWeekLabel()
  console.log(`[generator] Week: ${weekLabel}`)

  const octokit = new Octokit({ auth: process.env.GH_PAT })
  const owner = process.env.GH_OWNER ?? process.env.GITHUB_OWNER ?? 'lightouchconsulting'
  const repo = process.env.GH_REPO ?? process.env.GITHUB_REPO ?? 'Website'
  const date = new Date().toISOString().split('T')[0]

  console.log('[generator] Loading used article URLs...')
  const usedUrls = await getUsedUrls(octokit, owner, repo)
  console.log(`[generator] ${usedUrls.size} URLs already used`)

  console.log('[generator] Scraping feeds...')
  const articles = await scrapeFeeds(feedsConfig.feeds)
  console.log(`[generator] Found ${articles.length} articles`)

  const freshArticles = articles.filter(a => !usedUrls.has(a.link))
  console.log(`[generator] ${freshArticles.length} fresh articles after filtering ${articles.length - freshArticles.length} already-used`)

  if (freshArticles.length === 0) {
    console.log('[generator] No fresh articles found — exiting')
    return
  }

  console.log('[generator] Classifying articles...')
  const classified = await classifyArticles(freshArticles, themesConfig.themes)

  console.log('[generator] Synthesizing posts...')
  const posts = await synthesizePosts(classified, themesConfig.themes, weekLabel)
  console.log(`[generator] Generated ${posts.length} posts`)

  await Promise.all(posts.map(async (post) => {
    const filename = `${post.theme.toLowerCase()}.md`
    const filePath = `content/drafts/${date}/${filename}`
    const fileContent = buildFrontmatter({ ...post, date }) + post.content

    try {
      let sha: string | undefined
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path: filePath })
        if (!Array.isArray(data) && data.type === 'file') sha = data.sha
      } catch { /* file doesn't exist yet */ }

      await octokit.repos.createOrUpdateFileContents({
        owner, repo,
        path: filePath,
        message: `feat: generate draft ${post.theme} post for ${date}`,
        content: Buffer.from(fileContent).toString('base64'),
        ...(sha ? { sha } : {}),
      })
      console.log(`[generator] Created ${filePath}`)
    } catch (err) {
      console.error(`[generator] Failed to commit ${filePath}:`, (err as Error).message)
    }
  }))

  // Save all used URLs (existing + newly scraped fresh articles)
  const updatedUrls = new Set([...usedUrls, ...freshArticles.map(a => a.link)])
  await saveUsedUrls(octokit, owner, repo, updatedUrls)
  console.log(`[generator] Saved ${updatedUrls.size} used URLs`)

  console.log('[generator] Done.')
}

main().catch(err => {
  console.error('[generator] Fatal error:', err)
  process.exit(1)
})
