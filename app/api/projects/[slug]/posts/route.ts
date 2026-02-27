import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createFile } from '@/lib/github'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'admin' && role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  if (!/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  if (role === 'consultant' && !(session?.user?.projects ?? []).includes(slug)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body } = await request.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  const date = new Date().toISOString().split('T')[0]
  const fileSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const filename = `${date}-${fileSlug}.md`
  const content = `---\ntitle: "${title}"\ndate: "${date}"\nauthor: "${session?.user?.name ?? 'Unknown'}"\n---\n\n${body}`

  await createFile(
    `content/projects/${slug}/collaboration/${filename}`,
    content,
    `feat: add collaboration post "${title}" to project ${slug}`
  )

  return NextResponse.json({ ok: true })
}
