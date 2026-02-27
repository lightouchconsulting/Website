import Anthropic from '@anthropic-ai/sdk'
import type { ClassifiedArticle } from './classifier'

const client = new Anthropic()

export interface DraftPost {
  theme: string
  subThemes: string[]
  title: string
  content: string
  sources: { title: string; url: string; source: string }[]
  weekLabel: string
}

export async function synthesizePosts(
  classifiedArticles: ClassifiedArticle[],
  themes: { name: string }[],
  weekLabel: string
): Promise<DraftPost[]> {
  const posts: DraftPost[] = []

  for (const theme of themes) {
    const articles = classifiedArticles.filter(a => a.theme === theme.name)
    if (articles.length === 0) {
      console.log(`[synthesizer] No articles for theme: ${theme.name} — skipping`)
      continue
    }

    const sources = articles.slice(0, 5).map(a => ({
      title: a.title,
      url: a.link,
      source: a.source,
    }))

    const sourceContext = articles
      .slice(0, 5)
      .map(a => `Title: ${a.title}\nSource: ${a.source}\nSnippet: ${a.snippet}`)
      .join('\n\n')

    const prompt = `You are a senior technology consultant writing for CIOs and technology leaders at a Lightouch Consulting blog.

Write an original ~600-word insight article on the theme of "${theme.name}" for the week of ${weekLabel}.

Use these recent news articles as context and inspiration (do not quote or summarise them directly — synthesise your own insight):
${sourceContext}

Requirements:
- Write for a CIO audience — strategic, direct, no fluff
- 3-4 sections with ## headings
- End with a practical "Your Next Step" section
- Original analysis, not a news summary
- Title should be compelling and specific to this week's theme
- Return ONLY the Markdown content starting with the title as a # heading, no preamble

Write the article now:`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const titleMatch = text.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : `${theme.name}: Weekly Insights — ${weekLabel}`
      const subThemes = articles
        .flatMap(a => a.subThemes)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 3)

      posts.push({ theme: theme.name, subThemes, title, content: text, sources, weekLabel })
    } catch (err) {
      console.error(`[synthesizer] Failed for theme ${theme.name}:`, (err as Error).message)
    }
  }

  return posts
}
