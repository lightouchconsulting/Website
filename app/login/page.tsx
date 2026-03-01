'use client'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function LoginPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Sign in to Lightouch</h1>

        {session?.user?.role === 'unauthorized' && (
          <p className="text-red-400 text-sm mb-6">
            Your LinkedIn account is not authorised. Contact your administrator.
          </p>
        )}

        {!session && (
          <p className="text-gray-400 text-sm mb-6">Use your LinkedIn account to continue.</p>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => signIn('linkedin', { callbackUrl: '/portal' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Sign in with LinkedIn
          </button>

          {session && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-400 hover:text-white underline underline-offset-4"
            >
              Sign out ({session.user?.name ?? session.user?.email})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
