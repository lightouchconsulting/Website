import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fsPromises from 'fs/promises'

vi.mock('fs/promises')

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
    vi.mocked(fsPromises.readdir).mockResolvedValue([] as any)
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('admin-123')
    expect(result?.role).toBe('admin')
    expect(result?.projects).toEqual([])
  })

  it('returns null for unknown LinkedIn ID', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue([] as any)
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('unknown-999')
    expect(result).toBeNull()
  })

  it('returns consultant role with empty projects when no configs', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue([] as any)
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('consultant-789')
    expect(result?.role).toBe('consultant')
    expect(result?.projects).toEqual([])
  })

  it('returns consultant role with assigned projects', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(['acme-corp'] as any)
    vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify({
      name: 'Acme Corp',
      consultants: ['consultant-789'],
      clients: ['client-555'],
    }) as any)
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('consultant-789')
    expect(result?.role).toBe('consultant')
    expect(result?.projects).toContain('acme-corp')
  })

  it('returns client role with projects for known client', async () => {
    vi.mocked(fsPromises.readdir).mockResolvedValue(['acme-corp'] as any)
    vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify({
      name: 'Acme Corp',
      consultants: ['consultant-789'],
      clients: ['client-555'],
    }) as any)
    const { resolveRole } = await import('./roles')
    const result = await resolveRole('client-555')
    expect(result?.role).toBe('client')
    expect(result?.projects).toContain('acme-corp')
  })
})
