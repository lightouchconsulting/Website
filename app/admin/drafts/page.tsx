import { Octokit } from '@octokit/rest'
import matter from 'gray-matter'
import Link from 'next/link'
import GenerateButton from './GenerateButton'

interface DraftMeta {
  week: string
  slug: string
  title: string
  theme: string
}

async function getDrafts(): Promise<DraftMeta[]> {
  const octokit = new Octokit({ auth: process.env.GH_PAT })
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'content/drafts' })
    if (!Array.isArray(data)) return []

    const weeks = data.filter(item => item.type === 'dir')

    const draftsByWeek = await Promise.all(weeks.map(async (week) => {
      try {
        const { data: files } = await octokit.repos.getContent({ owner, repo, path: week.path })
        if (!Array.isArray(files)) return []

        const mdFiles = files.filter(f => f.name.endsWith('.md'))

        const drafts = await Promise.all(mdFiles.map(async (file) => {
          try {
            const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: file.path })
            if (Array.isArray(fileData) || fileData.type !== 'file') return null
            const raw = Buffer.from(fileData.content, 'base64').toString('utf-8')
            const { data: fm } = matter(raw)
            return {
              week: week.name,
              slug: file.name.replace('.md', ''),
              title: fm.title ?? file.name,
              theme: fm.theme ?? '',
            } satisfies DraftMeta
          } catch { return null }
        }))

        return drafts.filter((d): d is DraftMeta => d !== null)
      } catch { return [] }
    }))

    return draftsByWeek.flat().sort((a, b) => b.week.localeCompare(a.week))
  } catch {
    return []
  }
}

export default async function DraftsPage() {
  const drafts = await getDrafts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Draft Posts</h1>
        <GenerateButton />
      </div>

      {drafts.length === 0 && (
        <p className="text-gray-500">No drafts pending review. Click "Generate Articles" to create new drafts.</p>
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
