# Blog Generator Grounding Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automated fact-checking/revision pass to the blog generator so drafts with claims unsupported by their source articles are caught and fixed (or flagged) before being committed as drafts.

**Architecture:** A new `blog-generator/verifier.ts` module runs after `synthesizePosts()` and before drafts are committed to GitHub. It checks each draft against the source material it was built from, and if unsupported claims are found, does a targeted revision (not a full regenerate), retrying up to 3 cycles. `synthesizer.ts` is extended to expose the `sourceContext` it already builds internally so the verifier can reuse it.

**Tech Stack:** TypeScript, Groq SDK (`groq-sdk`, already a dependency), Vitest for tests (mocking `groq-sdk` the same way `lib/roles.test.ts` mocks `fs/promises`).

## Global Constraints

- No new npm dependencies — reuse the existing `groq-sdk` client pattern from `classifier.ts`/`synthesizer.ts`.
- Model: `llama-3.3-70b-versatile` (same as the rest of the blog generator), `temperature: 0` for both grounding calls (deterministic fact-checking, not creative writing).
- Retry cap: exactly 3 check/revise cycles (spec: `docs/superpowers/specs/2026-08-29-blog-grounding-verification-design.md`).
- Unresolved-after-3-attempts drafts are never discarded and never silently committed clean — they get the warning line prepended.
- A grounding failure for one theme must never crash the whole weekly run (matches existing per-item error handling in `classifier.ts`/`synthesizer.ts`).
- Tests run with: `npx vitest run <path>` (no `test` npm script exists in this repo — use the direct command).

---

### Task 1: Expose `sourceContext` from `synthesizePosts()`

**Files:**
- Modify: `blog-generator/synthesizer.ts:9-18` (interface), `blog-generator/synthesizer.ts:82` (return statement)
- Test: `blog-generator/synthesizer.test.ts` (new)

**Interfaces:**
- Produces: `DraftPost.sourceContext: string` — the same `Title: ...\nSource: ...\nSnippet: ...` block (joined by `\n\n`) already built at `synthesizer.ts:42-44`, now attached to the returned post so Task 2/3 code can consume it without rebuilding it.

- [ ] **Step 1: Write the failing test**

Create `blog-generator/synthesizer.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

const mockCreate = vi.fn()
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

import { synthesizePosts } from './synthesizer'
import type { ClassifiedArticle } from './classifier'

describe('synthesizePosts', () => {
  it('includes sourceContext built from the selected source articles', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '# Test Title\n\nBody text.' } }],
    })

    const articles: ClassifiedArticle[] = [
      {
        title: 'Example Article',
        link: 'https://example.com/a',
        source: 'Example Source',
        snippet: 'An example snippet.',
        pubDate: '2026-01-01T00:00:00.000Z',
        theme: 'Strategy',
        subThemes: ['Innovation'],
      },
    ]

    const posts = await synthesizePosts(articles, [{ name: 'Strategy' }], '2026-W01')

    expect(posts).toHaveLength(1)
    expect(posts[0].sourceContext).toContain('Title: Example Article')
    expect(posts[0].sourceContext).toContain('Source: Example Source')
    expect(posts[0].sourceContext).toContain('Snippet: An example snippet.')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run blog-generator/synthesizer.test.ts`
Expected: FAIL — `posts[0].sourceContext` is `undefined`, so the `toContain` assertions fail (e.g. "Cannot read properties of undefined" or an assertion mismatch error).

- [ ] **Step 3: Add `sourceContext` to the interface**

In `blog-generator/synthesizer.ts`, modify the `DraftPost` interface (currently lines 9-18):

```ts
export interface DraftPost {
  theme: string
  subThemes: string[]
  title: string
  content: string
  sources: { title: string; url: string; source: string }[]
  weekLabel: string
  sourceContext: string
}
```

- [ ] **Step 4: Return `sourceContext` from the synthesis result**

In `blog-generator/synthesizer.ts`, find the return statement inside the `try` block (currently):

```ts
        console.log(`[synthesizer] Done: ${theme.name}`)
        return { theme: theme.name, subThemes, title, content: text, sources, weekLabel } as DraftPost
```

Replace with:

```ts
        console.log(`[synthesizer] Done: ${theme.name}`)
        return { theme: theme.name, subThemes, title, content: text, sources, weekLabel, sourceContext } as DraftPost
```

(`sourceContext` is already computed a few lines above this — no new computation needed, just include it in the returned object.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run blog-generator/synthesizer.test.ts`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Commit**

```bash
cd ~/Code
git add blog-generator/synthesizer.ts blog-generator/synthesizer.test.ts
git commit -m "Expose sourceContext from synthesizePosts for grounding verification"
```

---

### Task 2: Create the grounding verifier module

**Files:**
- Create: `blog-generator/verifier.ts`
- Test: `blog-generator/verifier.test.ts`

**Interfaces:**
- Consumes: nothing from other blog-generator modules (takes plain `content: string` and `sourceContext: string`, keeping it independently testable).
- Produces (used by Task 3):
  - `groundPost(content: string, sourceContext: string): Promise<GroundingResult>`
  - `interface GroundingResult { content: string; grounded: boolean; attempts: number }`

- [ ] **Step 1: Write the failing tests**

Create `blog-generator/verifier.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

import { groundPost } from './verifier'

function llmResponse(content: string) {
  return { choices: [{ message: { content } }] }
}

describe('groundPost', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('returns the original content unchanged when the first check finds no issues', async () => {
    mockCreate.mockResolvedValueOnce(llmResponse('[]'))

    const result = await groundPost('# Title\n\nClean body.', 'Title: Source A\nSnippet: fact.')

    expect(result).toEqual({ content: '# Title\n\nClean body.', grounded: true, attempts: 1 })
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('revises once and returns grounded content when the second check is clean', async () => {
    mockCreate
      .mockResolvedValueOnce(llmResponse('["The stat is invented"]'))
      .mockResolvedValueOnce(llmResponse('# Title\n\nRevised body without the invented stat.'))
      .mockResolvedValueOnce(llmResponse('[]'))

    const result = await groundPost('# Title\n\nBody with invented stat.', 'Title: Source A\nSnippet: fact.')

    expect(result).toEqual({
      content: '# Title\n\nRevised body without the invented stat.',
      grounded: true,
      attempts: 2,
    })
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('stops after 3 cycles and prepends a warning if still unresolved', async () => {
    mockCreate
      .mockResolvedValueOnce(llmResponse('["claim1"]'))
      .mockResolvedValueOnce(llmResponse('revised-1'))
      .mockResolvedValueOnce(llmResponse('["claim2"]'))
      .mockResolvedValueOnce(llmResponse('revised-2'))
      .mockResolvedValueOnce(llmResponse('["claim3"]'))
      .mockResolvedValueOnce(llmResponse('revised-3'))

    const result = await groundPost('# Title\n\noriginal.', 'Title: Source A\nSnippet: fact.')

    expect(result.grounded).toBe(false)
    expect(result.attempts).toBe(3)
    expect(result.content).toBe(
      '⚠️ Grounding check flagged possible unsupported claims after 3 revision attempts — review before publishing.\n\nrevised-3'
    )
    expect(mockCreate).toHaveBeenCalledTimes(6)
  })

  it('treats an API failure as unresolved without throwing', async () => {
    mockCreate.mockRejectedValueOnce(new Error('network error'))

    const result = await groundPost('# Title\n\noriginal.', 'Title: Source A\nSnippet: fact.')

    expect(result.grounded).toBe(false)
    expect(result.attempts).toBe(1)
    expect(result.content).toBe(
      '⚠️ Grounding check flagged possible unsupported claims after 3 revision attempts — review before publishing.\n\n# Title\n\noriginal.'
    )
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run blog-generator/verifier.test.ts`
Expected: FAIL — `blog-generator/verifier.ts` does not exist yet, so the import fails (e.g. "Cannot find module './verifier'").

- [ ] **Step 3: Write the implementation**

Create `blog-generator/verifier.ts`:

```ts
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
    model: 'llama-3.3-70b-versatile',
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
    model: 'llama-3.3-70b-versatile',
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run blog-generator/verifier.test.ts`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
cd ~/Code
git add blog-generator/verifier.ts blog-generator/verifier.test.ts
git commit -m "Add grounding verification module for blog generator drafts"
```

---

### Task 3: Wire the verifier into the generator pipeline

**Files:**
- Modify: `blog-generator/index.ts:1-6` (imports), `blog-generator/index.ts:104-107` (post-synthesis step), `blog-generator/index.ts:112` (commit loop source)

**Interfaces:**
- Consumes: `groundPost(content: string, sourceContext: string): Promise<GroundingResult>` from Task 2; `DraftPost.sourceContext` from Task 1.

- [ ] **Step 1: Add the import**

In `blog-generator/index.ts`, the current imports are:

```ts
import { scrapeFeeds } from './scraper'
import { classifyArticles } from './classifier'
import { synthesizePosts } from './synthesizer'
import { Octokit } from '@octokit/rest'
import path from 'path'
import fs from 'fs'
```

Add `groundPost`:

```ts
import { scrapeFeeds } from './scraper'
import { classifyArticles } from './classifier'
import { synthesizePosts } from './synthesizer'
import { groundPost } from './verifier'
import { Octokit } from '@octokit/rest'
import path from 'path'
import fs from 'fs'
```

- [ ] **Step 2: Insert the grounding step and use its output in the commit loop**

In `blog-generator/index.ts`, find:

```ts
  console.log('[generator] Synthesizing posts...')
  const posts = await synthesizePosts(classified, themesConfig.themes, weekLabel)
  console.log(`[generator] Generated ${posts.length} posts`)

  await Promise.all(posts.map(async (post) => {
```

Replace with:

```ts
  console.log('[generator] Synthesizing posts...')
  const posts = await synthesizePosts(classified, themesConfig.themes, weekLabel)
  console.log(`[generator] Generated ${posts.length} posts`)

  console.log('[generator] Verifying grounding...')
  const groundedPosts = await Promise.all(posts.map(async (post) => {
    const result = await groundPost(post.content, post.sourceContext)
    console.log(
      `[generator] Grounding ${post.theme}: ${result.grounded ? 'clean' : 'unresolved'} after ${result.attempts} attempt(s)`
    )
    return { ...post, content: result.content }
  }))

  await Promise.all(groundedPosts.map(async (post) => {
```

This is the only change needed to the commit loop's source array — everything inside the loop body already reads `post.content`, `post.theme`, etc. from whatever array it's mapped over, so no other lines in the loop change.

- [ ] **Step 3: Type-check**

There is no existing test harness for `index.ts`'s `main()` (it performs live network/API calls end-to-end and has no tests today) — verify this change with a type check instead:

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: The pre-existing unrelated failure `middleware.test.ts(7,36): error TS2307: Cannot find module './middleware'` may still appear (confirmed pre-existing, unrelated to this change). No new errors should appear referencing `blog-generator/index.ts` or `blog-generator/verifier.ts`.

- [ ] **Step 4: Commit**

```bash
cd ~/Code
git add blog-generator/index.ts
git commit -m "Wire grounding verification into blog generator pipeline"
```

---

## Self-Review Notes

- **Spec coverage:** `sourceContext` plumbing (Task 1), `checkGrounding`/`reviseContent`/`groundPost` with the 3-cycle cap (Task 2), unresolved-warning prepending (Task 2), error handling without throwing (Task 2), and pipeline integration (Task 3) all have tasks. The 4 test cases in Task 2 match the spec's Testing section exactly.
- **Placeholders:** none — every step has complete, runnable code.
- **Type consistency:** `GroundingResult` (Task 2) is used identically in Task 3's integration code (`result.grounded`, `result.attempts`, `result.content`). `DraftPost.sourceContext` (Task 1) is consumed by name in Task 3 (`post.sourceContext`). `groundPost(content, sourceContext)` signature is consistent between its definition (Task 2) and call site (Task 3).
- **Out of scope, confirmed not addressed here:** fetching full source article text, writing-style changes, admin panel UI changes — all explicitly deferred in the spec.
