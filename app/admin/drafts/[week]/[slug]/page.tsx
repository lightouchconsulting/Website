import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import DraftActions from './DraftActions'

async function getDraft(week: string, slug: string) {
  const filePath = path.join(process.cwd(), 'content', 'drafts', week, `${slug}.md`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(raw)
    return { week, slug, raw, data, content }
  } catch {
    return null
  }
}

export default async function DraftReviewPage({
  params,
}: {
  params: Promise<{ week: string; slug: string }>
}) {
  const { week, slug } = await params
  const draft = await getDraft(week, slug)
  if (!draft) notFound()

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
        {draft.data.theme} · {week}
      </p>
      <h1 className="text-2xl font-bold text-white mb-6">{draft.data.title}</h1>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
        {draft.content}
      </div>

      {draft.data.sources?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Sources</h3>
          <ul className="space-y-1">
            {draft.data.sources.map((s: { title: string; url: string; source: string }, i: number) => (
              <li key={i} className="text-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white underline">
                  {s.title}
                </a>
                <span className="text-gray-500 ml-2">— {s.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DraftActions week={week} slug={slug} initialContent={draft.raw} />
    </div>
  )
}
