import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { moveFile } from '@/lib/github'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { week, slug, content } = await request.json()
  const { data } = matter(content)

  // Build the published slug with week prefix if not already present
  const publishedSlug = data.slug ?? `${week}-${slug}`
  const fromPath = `content/drafts/${week}/${slug}.md`
  const toPath = `content/posts/${publishedSlug}.md`

  // Update status to published in the content
  const publishedContent = content.replace(/^status:.*$/m, 'status: published')

  await moveFile(fromPath, toPath, publishedContent, `feat: publish ${publishedSlug}`)

  return NextResponse.json({ ok: true })
}
