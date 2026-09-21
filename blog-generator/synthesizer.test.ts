import { describe, it, expect, vi } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } }
  }),
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
