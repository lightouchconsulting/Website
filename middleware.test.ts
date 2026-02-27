import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth', () => ({ default: (_config: unknown) => ({ auth: (fn: unknown) => fn }) }))
vi.mock('./auth.config', () => ({ authConfig: {} }))
vi.mock('next/server', () => ({ NextResponse: { redirect: vi.fn() } }))

import { getRedirectForRole } from './middleware'

describe('getRedirectForRole', () => {
  it('redirects null token to /login', () => {
    expect(getRedirectForRole(null, '/admin')).toBe('/login')
  })

  it('redirects unauthorized role to /login', () => {
    expect(getRedirectForRole({ role: 'unauthorized', projects: [] }, '/admin')).toBe('/login')
  })

  it('allows admin to access /admin', () => {
    expect(getRedirectForRole({ role: 'admin', projects: [] }, '/admin')).toBeNull()
  })

  it('blocks consultant from /admin, redirects to /portal', () => {
    expect(getRedirectForRole({ role: 'consultant', projects: [] }, '/admin')).toBe('/portal')
  })

  it('allows consultant to access /portal', () => {
    expect(getRedirectForRole({ role: 'consultant', projects: [] }, '/portal')).toBeNull()
  })

  it('allows client to access assigned project', () => {
    expect(getRedirectForRole({ role: 'client', projects: ['acme-corp'] }, '/portal/projects/acme-corp')).toBeNull()
  })

  it('blocks client from unassigned project', () => {
    expect(getRedirectForRole({ role: 'client', projects: ['acme-corp'] }, '/portal/projects/other-co')).toBe('/portal')
  })

  it('allows admin to access any project', () => {
    expect(getRedirectForRole({ role: 'admin', projects: [] }, '/portal/projects/anything')).toBeNull()
  })

  it('handles URL-encoded slugs', () => {
    expect(getRedirectForRole({ role: 'client', projects: ['acme-corp'] }, '/portal/projects/acme%2Dcorp')).toBeNull()
  })
})
