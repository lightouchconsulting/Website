'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectForm() {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
        return
      }
      router.refresh()
      setName('')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-lg font-semibold text-white">New Project</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Project name"
          className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 flex-1 focus:border-white outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-semibold px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 transition"
        >
          Create
        </button>
      </div>
    </form>
  )
}
