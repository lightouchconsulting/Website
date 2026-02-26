import Link from 'next/link'
import { getPosts } from '@/lib/blog'

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-2">Insights</h1>
      <p className="text-gray-400 mb-10">Weekly perspectives for technology leaders.</p>

      {posts.length === 0 && (
        <p className="text-gray-500">No posts published yet.</p>
      )}

      <div className="space-y-8">
        {posts.map(post => (
          <article key={post.slug} className="border-b border-gray-800 pb-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              {post.theme} · {post.weekLabel}
            </p>
            <h2 className="text-xl font-semibold text-white mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-gray-300 transition">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-400 text-sm mb-3">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="text-sm text-white underline underline-offset-4 hover:text-gray-300">
              Read more →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
