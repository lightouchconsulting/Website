import Link from 'next/link'
import { getPosts } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Published Posts</h1>

      {posts.length === 0 && (
        <p className="text-gray-500">No published posts yet.</p>
      )}

      <div className="space-y-3">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/admin/posts/${post.slug}`}
            className="block p-4 border border-gray-700 rounded hover:border-white transition"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              {post.theme} · Issue {post.issueNumber}
            </p>
            <h2 className="font-semibold text-white">{post.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
