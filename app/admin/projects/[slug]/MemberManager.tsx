'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  memberType: 'consultants' | 'clients'
  members: string[]
}

export default function MemberManager({ slug, memberType, members }: Props) {
  const [newId, setNewId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function modify(action: 'add' | 'remove', linkedinId: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${slug}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberType, action, linkedinId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
        return
      }
      router.refresh()
      setNewId('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white capitalize mb-4">{memberType}</h2>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      <ul className="space-y-2 mb-4">
        {members.length === 0 && <li className="text-gray-500 text-sm">None assigned.</li>}
        {members.map(id => (
          <li key={id} className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-300">{id}</span>
            <button
              onClick={() => modify('remove', id)}
              disabled={loading}
              className="text-red-400 text-xs hover:text-red-300 disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={e => { e.preventDefault(); modify('add', newId) }}
        className="flex gap-2"
      >
        <input
          value={newId}
          onChange={e => setNewId(e.target.value)}
          placeholder="LinkedIn ID"
          className="bg-gray-900 border border-gray-700 text-white font-mono text-sm rounded px-3 py-2 flex-1 focus:border-white outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-semibold px-4 py-2 rounded text-sm hover:bg-gray-200 disabled:opacity-50 transition"
        >
          Add
        </button>
      </form>
    </section>
  )
}
