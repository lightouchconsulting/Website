import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

interface PostMeta {
  slug: string
  title: string
  date: string
}

async function getPosts(): Promise<PostMeta[]> {
  const dir = path.join(process.cwd(), 'content', 'best-practices')
  try {
    const files = await fs.readdir(dir)
    return await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async file => {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8')
        const { data } = matter(raw)
        return {
          slug: file.replace('.md', ''),
          title: data.title ?? file,
          date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '',
        }
      })
    )
  } catch {
    return []
  }
}

export default async function BestPracticesPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Best Practices</h1>
      {posts.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <ul className="space-y-4">
        {posts.map(post => (
          <li key={post.slug}>
            <Link
              href={`/portal/best-practices/${post.slug}`}
              className="text-white font-medium hover:underline"
            >
              {post.title}
            </Link>
            {post.date && <span className="text-gray-500 text-sm ml-3">{post.date}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
