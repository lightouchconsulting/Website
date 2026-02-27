import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('resolveRole', () => {
  beforeEach(() => {
    process.env.ADMIN_LINKEDIN_IDS = 'admin-123,admin-456'
    process.env.CONSULTANT_LINKEDIN_IDS = 'consultant-789,consultant-012'
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.ADMIN_LINKEDIN_IDS
    delete process.env.CONSULTANT_LINKEDIN_IDS
  })

  it('returns admin role for admin LinkedIn ID', async () => {
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('admin-123')
    expect(result?.role).toBe('admin')
    expect(result?.projects).toEqual([])
  })

  it('returns null for unknown LinkedIn ID', async () => {
    vi.mock('fs/promises', () => ({
      default: {
        readdir: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockRejectedValue(new Error('not found')),
      }
    }))
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('unknown-999')
    expect(result).toBeNull()
  })

  it('returns consultant role for consultant LinkedIn ID', async () => {
    vi.mock('fs/promises', () => ({
      default: {
        readdir: vi.fn().mockResolvedValue([]),
        readFile: vi.fn().mockRejectedValue(new Error('not found')),
      }
    }))
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('consultant-789')
    expect(result?.role).toBe('consultant')
  })

  it('returns client role with projects for known client', async () => {
    vi.mock('fs/promises', () => ({
      default: {
        readdir: vi.fn().mockResolvedValue(['acme-corp']),
        readFile: vi.fn().mockResolvedValue(JSON.stringify({
          name: 'Acme Corp',
          consultants: ['consultant-789'],
          clients: ['client-555'],
        })),
      }
    }))
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('client-555')
    expect(result?.role).toBe('client')
    expect(result?.projects).toContain('acme-corp')
  })
})
