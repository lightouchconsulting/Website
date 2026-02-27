import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !session.user?.role || session.user.role === 'unauthorized') {
    redirect('/login')
  }
  return <>{children}</>
}
