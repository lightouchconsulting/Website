import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

interface DraftMeta {
  week: string
  slug: string
  title: string
  theme: string
}

async function getDrafts(): Promise<DraftMeta[]> {
  const draftsDir = path.join(process.cwd(), 'content', 'drafts')
  try {
    const weeks = await fs.readdir(draftsDir)
    const drafts: DraftMeta[] = []
    for (const week of weeks) {
      const weekPath = path.join(draftsDir, week)
      const stat = await fs.stat(weekPath)
      if (!stat.isDirectory()) continue
      const files = await fs.readdir(weekPath)
      for (const file of files.filter(f => f.endsWith('.md'))) {
        const raw = await fs.readFile(path.join(weekPath, file), 'utf-8')
        const { data } = matter(raw)
        drafts.push({
          week,
          slug: file.replace('.md', ''),
          title: data.title ?? file,
          theme: data.theme ?? '',
        })
      }
    }
    return drafts
  } catch {
    return []
  }
}

export default async function DraftsPage() {
  const drafts = await getDrafts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Draft Posts</h1>

      {drafts.length === 0 && (
        <p className="text-gray-500">No drafts pending review.</p>
      )}

      <div className="space-y-3">
        {drafts.map(d => (
          <Link
            key={`${d.week}/${d.slug}`}
            href={`/admin/drafts/${d.week}/${d.slug}`}
            className="block p-4 border border-gray-700 rounded hover:border-white transition"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{d.theme} · {d.week}</p>
            <h2 className="font-semibold text-white">{d.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
