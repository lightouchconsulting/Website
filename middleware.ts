import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Protect /admin and /portal
  if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
    if (!session) {
      return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }
    // Only admins can access /admin
    if (pathname.startsWith('/admin') && session.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
}
