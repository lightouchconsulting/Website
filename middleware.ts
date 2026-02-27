import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    if (!session || session.user?.role === 'unauthorized') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/admin') && session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
    // Project-scoped access: clients and consultants only see their assigned projects
    if (pathname.startsWith('/portal/projects/')) {
      const slug = pathname.split('/portal/projects/')[1]?.split('/')[0]
      const role = session.user?.role
      const projects = session.user?.projects ?? []
      if (slug && role !== 'admin' && !projects.includes(slug)) {
        return NextResponse.redirect(new URL('/portal', req.url))
      }
    }
  }
})

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}
