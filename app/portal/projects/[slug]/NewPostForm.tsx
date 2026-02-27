'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPostForm({ slug }: { slug: string }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${slug}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
        return
      }
      router.refresh()
      setTitle('')
      setBody('')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-700 rounded p-4 space-y-3 mb-8">
      <h2 className="font-semibold text-white">New Post</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 focus:border-white outline-none"
        required
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your post..."
        className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 h-32 focus:border-white outline-none"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black font-semibold px-4 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50 transition"
      >
        Post
      </button>
    </form>
  )
}
