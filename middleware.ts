import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (pathname.startsWith('/admin') && session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }
})

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}
