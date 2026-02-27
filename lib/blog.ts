import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export interface Post {
  slug: string
  title: string
  theme: string
  subThemes: string[]
  weekLabel: string
  date: string
  status: string
  excerpt: string
}

export interface FullPost extends Post {
  content: string
  sources: { title: string; url: string; source: string }[]
}

export async function getPosts(): Promise<Post[]> {
  const dir = path.join(process.cwd(), 'content', 'posts')
  try {
    const files = await fs.readdir(dir)
    const posts = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async file => {
          const raw = await fs.readFile(path.join(dir, file), 'utf-8')
          const { data, content } = matter(raw)
          return {
            slug: data.slug ?? file.replace('.md', ''),
            title: data.title ?? '',
            theme: data.theme ?? '',
            subThemes: data.subThemes ?? [],
            weekLabel: data.weekLabel ?? '',
            date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
            status: data.status ?? 'draft',
            excerpt: content.trim().split('\n').find(l => l && !l.startsWith('#')) ?? '',
          } satisfies Post
        })
    )
    return posts.filter(p => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

export async function getPost(slug: string): Promise<FullPost | null> {
  if (!/^[\w-]+$/.test(slug)) return null
  const filePath = path.join(process.cwd(), 'content', 'posts', `${slug}.md`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(raw)
    const post = {
      slug: data.slug ?? slug,
      title: data.title ?? '',
      theme: data.theme ?? '',
      subThemes: data.subThemes ?? [],
      weekLabel: data.weekLabel ?? '',
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
      status: data.status ?? 'draft',
      sources: data.sources ?? [],
      excerpt: content.trim().split('\n').find((l: string) => l && !l.startsWith('#')) ?? '',
      content,
    }
    if (post.status !== 'published') return null
    return post
  } catch {
    return null
  }
}
