import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !session.user?.role || session.user.role === 'unauthorized') {
    redirect('/login')
  }
  return (
    <>
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/portal" className="text-xl font-bold tracking-wide hover:text-yellow-400">
              Lightouch™ Portal
            </Link>
            <nav className="flex space-x-6 text-sm">
              <Link href="/portal/training" className="hover:text-yellow-400">Training</Link>
              <Link href="/portal/best-practices" className="hover:text-yellow-400">Best Practices</Link>
              {session.user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-yellow-400">Admin</Link>
              )}
              <Link href="/" className="hover:text-yellow-400">Main Site</Link>
              <a href="/api/auth/signout" className="hover:text-yellow-400">Sign Out</a>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
