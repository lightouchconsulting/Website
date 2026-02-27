import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Lightouch-BlogGenerator/1.0' },
})

export interface Article {
  title: string
  link: string
  source: string
  snippet: string
  pubDate: string
}

export async function scrapeFeeds(feedUrls: string[], cutoffDays = 7): Promise<Article[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - cutoffDays)

  const results: Article[] = []

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url)
      const sourceName = feed.title ?? new URL(url).hostname

      for (const item of feed.items ?? []) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null
        if (pubDate && pubDate < cutoff) continue

        const title = item.title?.trim()
        const link = item.link?.trim()
        if (!title || !link) continue

        const snippet = (item.contentSnippet ?? item.summary ?? '').slice(0, 300).trim()

        results.push({ title, link, source: sourceName, snippet, pubDate: pubDate?.toISOString() ?? '' })
      }
    } catch (err) {
      console.warn(`[scraper] Failed to fetch ${url}:`, (err as Error).message)
    }
  }

  return results
}
