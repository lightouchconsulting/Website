import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteFile } from '@/lib/github'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { week, slug } = await request.json()

  const safePattern = /^[\w-]+$/
  if (!safePattern.test(week) || !safePattern.test(slug)) {
    return NextResponse.json({ error: 'Invalid week or slug' }, { status: 400 })
  }

  await deleteFile(
    `content/drafts/${week}/${slug}.md`,
    `chore: reject draft ${slug}`
  )

  return NextResponse.json({ ok: true })
}
