import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

interface TokenPayload {
  role?: string
  projects?: string[]
}

export function getRedirectForRole(token: TokenPayload | null, pathname: string): string | null {
  if (!token || token.role === 'unauthorized') return '/login'

  if (pathname.startsWith('/admin') && token.role !== 'admin') return '/portal'

  if (pathname.startsWith('/portal/projects/')) {
    const raw = pathname.split('/portal/projects/')[1]?.split('/')[0]
    const slug = raw ? decodeURIComponent(raw) : undefined
    if (slug && token.role !== 'admin' && !(token.projects ?? []).includes(slug)) {
      return '/portal'
    }
  }

  return null
}

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    const redirect = getRedirectForRole(session?.user ?? null, pathname)
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, req.url))
    }
  }
})

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}
