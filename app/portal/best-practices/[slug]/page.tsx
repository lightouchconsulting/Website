import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function BestPracticePostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const filePath = path.join(process.cwd(), 'content', 'best-practices', `${slug}.md`)
  let title = ''
  let content = ''
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = matter(raw)
    title = parsed.data.title ?? slug
    content = parsed.content
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Link href="/portal/best-practices" className="text-sm text-gray-400 hover:text-white mb-8 inline-block">
        ← Best Practices
      </Link>
      <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
      <div className="text-gray-300 space-y-4">
        {content.split('\n').map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="text-white text-lg font-semibold mt-6 mb-2">{line.slice(4)}</h3>
          if (line.startsWith('## ')) return <h2 key={i} className="text-white text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2>
          if (line.startsWith('# ')) return <h1 key={i} className="text-white text-2xl font-bold mt-8 mb-3">{line.slice(2)}</h1>
          if (line.trim() === '') return <br key={i} />
          return <p key={i}>{line}</p>
        })}
      </div>
    </div>
  )
}
