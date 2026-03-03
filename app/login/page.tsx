'use client'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function LoginPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Lightouch™ Portal</h1>

        {session?.user?.role === 'unauthorized' && (
          <p className="text-red-400 text-sm mb-6">
            Your LinkedIn account is not authorised. Contact your administrator.
          </p>
        )}

        {!session && (
          <p className="text-gray-400 text-sm mb-6">Sign in with your LinkedIn account to continue.</p>
        )}

        {session && session.user?.role !== 'unauthorized' && (
          <p className="text-gray-400 text-sm mb-6">
            Signed in as <span className="text-white">{session.user?.name}</span>
          </p>
        )}

        <div className="flex flex-col items-center gap-4">
          {!session ? (
            <button
              onClick={() => signIn('linkedin', { callbackUrl: '/portal' })}
              className="flex items-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <i className="fa-brands fa-linkedin text-xl" />
              Sign in with LinkedIn
            </button>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <i className="fa-brands fa-linkedin text-xl" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
