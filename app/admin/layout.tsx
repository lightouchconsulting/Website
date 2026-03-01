import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    redirect('/login')
  }
  return (
    <>
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin" className="text-xl font-bold tracking-wide hover:text-yellow-400">
              Lightouch™ Admin
            </Link>
            <nav className="flex space-x-6 text-sm">
              <Link href="/admin/drafts" className="hover:text-yellow-400">Drafts</Link>
              <Link href="/admin/projects" className="hover:text-yellow-400">Projects</Link>
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
