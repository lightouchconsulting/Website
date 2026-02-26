'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-6">Sign in to Lightouch</h1>
        <button
          onClick={() => signIn('linkedin')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  )
}
