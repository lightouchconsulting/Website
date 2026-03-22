import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Octokit } from '@octokit/rest'
import EditForm from './EditForm'

export const dynamic = 'force-dynamic'

async function getRawPost(slug: string): Promise<string | null> {
  if (!/^[\w-]+$/.test(slug)) return null
  const octokit = new Octokit({ auth: process.env.GH_PAT })
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: `content/posts/${slug}.md`,
    })
    if (Array.isArray(data) || data.type !== 'file') return null
    return Buffer.from(data.content, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const raw = await getRawPost(slug)
  if (!raw) notFound()

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <Link href="/admin/posts" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">
        ← Published Posts
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Post</h1>
      <p className="text-xs text-gray-500 mb-4">Editing <code className="text-gray-400">content/posts/{slug}.md</code></p>
      <EditForm slug={slug} initialContent={raw} />
    </div>
  )
}
