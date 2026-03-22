import Groq from 'groq-sdk'
import type { Article } from './scraper'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ClassifiedArticle extends Article {
  theme: string
  subThemes: string[]
}

const BATCH_SIZE = 30

async function classifyBatch(
  batch: Article[],
  offset: number,
  themeList: string
): Promise<ClassifiedArticle[]> {
  const articleList = batch
    .map((a, idx) => `${offset + idx + 1}. "${a.title}" — ${a.snippet}`)
    .join('\n')

  const prompt = `You are a content classifier for a CIO-focused technology consulting firm.

Classify each article into exactly one of these 7 themes:
${themeList}

Articles:
${articleList}

Respond with a JSON array only, one entry per article, in this exact format:
[{"index": ${offset + 1}, "theme": "Strategy", "subThemes": ["Innovation"]}, ...]

Only include the JSON array in your response, no other text.`

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0,
  })

  const text = response.choices[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  const parsed: { index: number; theme: string; subThemes: string[] }[] = JSON.parse(jsonMatch?.[0] ?? text)

  return parsed.map(result => {
    const article = batch[result.index - offset - 1]
    if (!article) return null
    return { ...article, theme: result.theme, subThemes: result.subThemes ?? [] }
  }).filter((a): a is ClassifiedArticle => a !== null)
}

export async function classifyArticles(
  articles: Article[],
  themes: { name: string; subThemes: string[] }[]
): Promise<ClassifiedArticle[]> {
  if (articles.length === 0) return []

  const themeList = themes.map(t => `- ${t.name}: ${t.subThemes.join(', ')}`).join('\n')

  // Split into batches of BATCH_SIZE and classify each sequentially
  const results: ClassifiedArticle[] = []
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE)
    console.log(`[classifier] Classifying batch ${Math.floor(i / BATCH_SIZE) + 1} (articles ${i + 1}–${i + batch.length})`)
    try {
      const classified = await classifyBatch(batch, i, themeList)
      results.push(...classified)
    } catch (err) {
      console.warn(`[classifier] Batch failed, assigning to Strategy:`, (err as Error).message)
      results.push(...batch.map(a => ({ ...a, theme: 'Strategy', subThemes: [] })))
    }
  }

  return results
}
