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

  const safePattern = /^[\w-]+$/
  if (!safePattern.test(week) || !safePattern.test(slug)) {
    return NextResponse.json({ error: 'Invalid week or slug' }, { status: 400 })
  }

  const { data } = matter(content)

  // Build the published slug with week prefix if not already present
  const publishedSlug = data.slug ?? `${week}-${slug}`
  if (!safePattern.test(publishedSlug)) {
    return NextResponse.json({ error: 'Invalid slug in frontmatter' }, { status: 400 })
  }
  const fromPath = `content/drafts/${week}/${slug}.md`
  const toPath = `content/posts/${publishedSlug}.md`

  // Update status to published in the content
  let publishedContent: string
  if (/^status:/m.test(content)) {
    publishedContent = content.replace(/^status:.*$/m, 'status: published')
  } else {
    // Insert status: published before the closing --- of frontmatter
    publishedContent = content.replace(/^(---\n[\s\S]*?)\n---/m, '$1\nstatus: published\n---')
  }

  await moveFile(fromPath, toPath, publishedContent, `feat: publish ${publishedSlug}`)

  return NextResponse.json({ ok: true })
}
