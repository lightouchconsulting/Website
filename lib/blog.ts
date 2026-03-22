import { Octokit } from '@octokit/rest'
import matter from 'gray-matter'

const octokit = new Octokit({ auth: process.env.GH_PAT })
const owner = process.env.GITHUB_OWNER!
const repo = process.env.GITHUB_REPO!

export interface Post {
  slug: string
  title: string
  theme: string
  subThemes: string[]
  weekLabel: string
  date: string
  status: string
  excerpt: string
  issueNumber: number
}

export interface FullPost extends Post {
  content: string
  sources: { title: string; url: string; source: string }[]
}

export async function getPosts(): Promise<Post[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'content/posts' })
    if (!Array.isArray(data)) return []

    const posts = await Promise.all(
      data
        .filter(f => f.type === 'file' && f.name.endsWith('.md'))
        .map(async file => {
          try {
            const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: file.path })
            if (Array.isArray(fileData) || fileData.type !== 'file') return null
            const raw = Buffer.from(fileData.content, 'base64').toString('utf-8')
            const { data: fm, content } = matter(raw)
            return {
              slug: fm.slug ?? file.name.replace('.md', ''),
              title: fm.title ?? '',
              theme: fm.theme ?? '',
              subThemes: fm.subThemes ?? [],
              weekLabel: fm.weekLabel ?? '',
              date: fm.date ? new Date(fm.date).toISOString().slice(0, 10) : '',
              status: fm.status ?? 'draft',
              excerpt: content.trim().split('\n').find((l: string) => l && !l.startsWith('#')) ?? '',
              issueNumber: 0,
            } satisfies Post
          } catch { return null }
        })
    )

    const published = posts
      .filter((p): p is Post => p !== null && p.status === 'published')
      .sort((a, b) => a.date.localeCompare(b.date))

    // Assign sequential issue numbers oldest-first, then return newest-first
    return published
      .map((p, i) => ({ ...p, issueNumber: i + 1 }))
      .reverse()
  } catch {
    return []
  }
}

export async function getPost(slug: string): Promise<FullPost | null> {
  if (!/^[\w-]+$/.test(slug)) return null
  try {
    const [{ data }, allPosts] = await Promise.all([
      octokit.repos.getContent({ owner, repo, path: `content/posts/${slug}.md` }),
      getPosts(),
    ])
    if (Array.isArray(data) || data.type !== 'file') return null
    const raw = Buffer.from(data.content, 'base64').toString('utf-8')
    const { data: fm, content } = matter(raw)
    const issueNumber = allPosts.find(p => p.slug === (fm.slug ?? slug))?.issueNumber ?? 0
    const post = {
      slug: fm.slug ?? slug,
      title: fm.title ?? '',
      theme: fm.theme ?? '',
      subThemes: fm.subThemes ?? [],
      weekLabel: fm.weekLabel ?? '',
      date: fm.date ? new Date(fm.date).toISOString().slice(0, 10) : '',
      status: fm.status ?? 'draft',
      sources: fm.sources ?? [],
      excerpt: content.trim().split('\n').find((l: string) => l && !l.startsWith('#')) ?? '',
      content,
      issueNumber,
    }
    if (post.status !== 'published') return null
    return post
  } catch {
    return null
  }
}
