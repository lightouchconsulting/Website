import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NewPostForm from './NewPostForm'

interface CollabPost {
  title: string
  date: string
  author: string
  content: string
}

async function getProjectName(slug: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'content', 'projects', slug, 'config.json'),
      'utf-8'
    )
    return JSON.parse(raw).name ?? slug
  } catch {
    return null
  }
}

async function getPosts(slug: string): Promise<CollabPost[]> {
  const dir = path.join(process.cwd(), 'content', 'projects', slug, 'collaboration')
  try {
    const files = await fs.readdir(dir)
    const posts = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async file => {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8')
        const { data, content } = matter(raw)
        return {
          title: data.title ?? file,
          date: data.date ?? '',
          author: data.author ?? '',
          content,
        }
      })
    )
    return posts.sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [session, projectName, posts] = await Promise.all([
    auth(),
    getProjectName(slug),
    getPosts(slug),
  ])

  if (!projectName) notFound()

  const canPost = session?.user?.role === 'admin' || session?.user?.role === 'consultant'

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Link href="/portal" className="text-sm text-gray-400 hover:text-white mb-8 inline-block">
        ← Portal
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">{projectName}</h1>
      <p className="text-gray-400 mb-8">Project collaboration space</p>

      {canPost && <NewPostForm slug={slug} />}

      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post, i) => (
            <article key={i} className="border-b border-gray-800 pb-6">
              <h2 className="font-semibold text-white">{post.title}</h2>
              <p className="text-xs text-gray-500 mt-1 mb-3">{post.date} · {post.author}</p>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{post.content.trim()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
