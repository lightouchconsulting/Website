import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createFile } from '@/lib/github'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, slug } = await request.json()
  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }
  // Validate slug is safe
  if (!/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const config = { name, consultants: [], clients: [] }
  await createFile(
    `content/projects/${slug}/config.json`,
    JSON.stringify(config, null, 2),
    `feat: create project ${name}`
  )

  return NextResponse.json({ ok: true })
}
