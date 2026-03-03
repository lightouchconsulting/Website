import Groq from 'groq-sdk'
import type { Article } from './scraper'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ClassifiedArticle extends Article {
  theme: string
  subThemes: string[]
}

export async function classifyArticles(
  articles: Article[],
  themes: { name: string; subThemes: string[] }[]
): Promise<ClassifiedArticle[]> {
  if (articles.length === 0) return []

  const themeList = themes.map(t => `- ${t.name}: ${t.subThemes.join(', ')}`).join('\n')
  const articleList = articles
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
    const response = await client.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0,
    })

    const text = response.choices[0]?.message?.content ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const parsed: { index: number; theme: string; subThemes: string[] }[] = JSON.parse(jsonMatch?.[0] ?? text)

    return parsed.map(result => {
      const article = articles[result.index - 1]
      if (!article) return null
      return { ...article, theme: result.theme, subThemes: result.subThemes ?? [] }
    }).filter((a): a is ClassifiedArticle => a !== null)

  } catch (err) {
    console.warn('[classifier] Failed, falling back to Strategy for all:', (err as Error).message)
    return articles.map(a => ({ ...a, theme: 'Strategy', subThemes: [] }))
  }
}
