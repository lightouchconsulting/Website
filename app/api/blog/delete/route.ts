import { NextRequest, NextResponse } from 'next/server'
import { deleteFile } from '@/lib/github'

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    if (!slug || !/^[\w-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    await deleteFile(`content/posts/${slug}.md`, `chore: delete post ${slug}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
