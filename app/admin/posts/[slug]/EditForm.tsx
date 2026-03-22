"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EditForm({ slug, initialContent }: { slug: string; initialContent: string }) {
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSave = async () => {
    setStatus("saving")
    setError("")
    try {
      const res = await fetch("/api/blog/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setStatus("saved")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setStatus("error")
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={e => { setContent(e.target.value); setStatus("idle") }}
        className="w-full h-[60vh] bg-gray-900 text-gray-100 border border-gray-700 rounded p-4 font-mono text-sm focus:outline-none focus:border-white resize-y"
        spellCheck={false}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === "saving" ? "Saving…" : "Save Changes"}
        </button>
        {status === "saved" && <p className="text-sm text-green-400">Saved!</p>}
        {status === "error" && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
