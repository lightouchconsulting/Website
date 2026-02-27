import Anthropic from '@anthropic-ai/sdk'
import type { Article } from './scraper'

const client = new Anthropic()

export interface ClassifiedArticle extends Article {
  theme: string
  subThemes: string[]
}

export async function classifyArticles(
  articles: Article[],
  themes: { name: string; subThemes: string[] }[]
): Promise<ClassifiedArticle[]> {
  const themeList = themes.map(t => `- ${t.name}: ${t.subThemes.join(', ')}`).join('\n')

  const results: ClassifiedArticle[] = []

  // Process in batches of 10 to avoid hitting token limits
  for (let i = 0; i < articles.length; i += 10) {
    const batch = articles.slice(i, i + 10)
    const articleList = batch
      .map((a, idx) => `${idx + 1}. "${a.title}" — ${a.snippet}`)
      .join('\n')

    const prompt = `You are a content classifier for a CIO-focused technology consulting firm.

Classify each article into exactly one of these 7 themes:
${themeList}

Articles:
${articleList}

Respond with a JSON array only, one entry per article, in this exact format:
[{"index": 1, "theme": "Strategy", "subThemes": ["Innovation"]}, ...]

Only include the JSON array in your response, no other text.`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const parsed = JSON.parse(text)

      for (const result of parsed) {
        const article = batch[result.index - 1]
        if (article) {
          results.push({
            ...article,
            theme: result.theme,
            subThemes: result.subThemes ?? [],
          })
        }
      }
    } catch (err) {
      console.warn(`[classifier] Batch ${i}-${i + 10} failed:`, (err as Error).message)
      // Add unclassified articles with fallback theme
      for (const article of batch) {
        results.push({ ...article, theme: 'Strategy', subThemes: [] })
      }
    }
  }

  return results
}
