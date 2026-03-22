import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Octokit } from '@octokit/rest'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug, content } = await request.json()

  if (!slug || typeof content !== 'string') {
    return NextResponse.json({ error: 'Missing slug or content' }, { status: 400 })
  }
  if (!/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const octokit = new Octokit({ auth: process.env.GH_PAT })
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const path = `content/posts/${slug}.md`

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path })
    if (Array.isArray(data) || data.type !== 'file') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `chore: edit published post ${slug}`,
      content: Buffer.from(content).toString('base64'),
      sha: data.sha,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
