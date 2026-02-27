'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DraftActions({
  week,
  slug,
  initialContent,
}: {
  week: string
  slug: string
  initialContent: string
}) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/blog/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week, slug, content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Failed to ${action} (${res.status})`)
        setLoading(false)
        return
      }
    } catch {
      setError(`Network error — please try again`)
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/admin/drafts')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-2">Edit before approving</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full h-64 bg-gray-900 text-gray-200 text-sm font-mono p-3 rounded border border-gray-700 focus:border-white outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('approve')}
          disabled={loading}
          className="bg-white text-black font-semibold px-6 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition"
        >
          Approve & Publish
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={loading}
          className="border border-gray-600 text-gray-300 font-semibold px-6 py-2 rounded hover:border-white hover:text-white disabled:opacity-50 transition"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
