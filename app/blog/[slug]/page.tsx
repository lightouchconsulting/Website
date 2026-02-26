import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPosts, getPost } from '@/lib/blog'

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Link href="/blog" className="text-sm text-gray-400 hover:text-white mb-8 inline-block">
        ← Back to Insights
      </Link>

      <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
        {post.theme} · {post.weekLabel}
      </p>
      <h1 className="text-3xl font-bold text-white mb-6">{post.title}</h1>

      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
        {post.content.split('\n').map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="text-white text-lg font-semibold mt-6 mb-2">{line.slice(4)}</h3>
          if (line.startsWith('## ')) return <h2 key={i} className="text-white text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2>
          if (line.startsWith('# ')) return <h1 key={i} className="text-white text-2xl font-bold mt-8 mb-3">{line.slice(2)}</h1>
          if (line.trim() === '') return <br key={i} />
          return <p key={i} className="mb-4">{line}</p>
        })}
      </div>

      {post.sources.length > 0 && (
        <div className="mt-12 border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Sources</h3>
          <ul className="space-y-2">
            {post.sources.map((s, i) => (
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
    </div>
  )
}
