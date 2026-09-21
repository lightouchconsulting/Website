import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))
vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } }
  }),
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
