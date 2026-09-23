import Groq from 'groq-sdk'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MAX_CYCLES = 3
const UNRESOLVED_WARNING =
  '⚠️ Grounding check flagged possible unsupported claims after 3 revision attempts — review before publishing.\n\n'

export interface GroundingResult {
  content: string
  grounded: boolean
  attempts: number
}

export async function checkGrounding(content: string, sourceContext: string): Promise<string[]> {
  const prompt = `You are a fact-checker for a technology consulting blog.

Below is a source material block and a draft article that claims to be based on it.

Source material:
${sourceContext}

Draft article:
${content}

List every specific claim, statistic, quote, or named fact in the draft article that is NOT supported by the source material above. Ignore general commentary, opinions, or strategic advice that doesn't assert a specific fact.

Respond with a JSON array of strings only, one per unsupported claim, quoting the exact sentence or phrase from the draft. If there are no unsupported claims, respond with an empty array: []

Only include the JSON array in your response, no other text.`

  const response = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0,
  })

  const text = response.choices[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  const parsed: unknown = JSON.parse(jsonMatch?.[0] ?? text)
  if (!Array.isArray(parsed)) return []
  return parsed.filter((c): c is string => typeof c === 'string')
}

export async function reviseContent(
  content: string,
  sourceContext: string,
  issues: string[]
): Promise<string> {
  const issuesList = issues.map(i => `- ${i}`).join('\n')
  const prompt = `You are editing a draft article for factual accuracy.

Source material:
${sourceContext}

Draft article:
${content}

The following specific claims in the draft are NOT supported by the source material above:
${issuesList}

Rewrite the article, removing or generalising ONLY these specific claims so the article no longer asserts anything unsupported by the source material. Do not change any other part of the article. Keep the same Markdown structure and headings.

Return ONLY the full revised Markdown article, no preamble.`

  const response = await client.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0,
  })

  return response.choices[0]?.message?.content?.trim() ?? content
}

export async function groundPost(content: string, sourceContext: string): Promise<GroundingResult> {
  let current = content

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    let issues: string[]
    try {
      issues = await checkGrounding(current, sourceContext)
    } catch (err) {
      console.warn(`[verifier] checkGrounding failed on cycle ${cycle}:`, (err as Error).message)
      return { content: UNRESOLVED_WARNING + current, grounded: false, attempts: cycle }
    }

    if (issues.length === 0) {
      return { content: current, grounded: true, attempts: cycle }
    }

    try {
      current = await reviseContent(current, sourceContext, issues)
    } catch (err) {
      console.warn(`[verifier] reviseContent failed on cycle ${cycle}:`, (err as Error).message)
      return { content: UNRESOLVED_WARNING + current, grounded: false, attempts: cycle }
    }
  }

  return { content: UNRESOLVED_WARNING + current, grounded: false, attempts: MAX_CYCLES }
}
