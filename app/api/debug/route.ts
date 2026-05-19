import { Octokit } from '@octokit/rest'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const pat = process.env.GH_PAT
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO

  const envCheck = {
    GH_PAT: pat ? `set (${pat.slice(0, 8)}...)` : 'MISSING',
    GITHUB_OWNER: owner ?? 'MISSING',
    GITHUB_REPO: repo ?? 'MISSING',
  }

  if (!pat || !owner || !repo) {
    return NextResponse.json({ envCheck, error: 'Missing env vars' }, { status: 500 })
  }

  try {
    const octokit = new Octokit({ auth: pat })
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'content/posts' })
    const files = Array.isArray(data) ? data.map(f => f.name) : []
    return NextResponse.json({ envCheck, files })
  } catch (err) {
    return NextResponse.json({ envCheck, error: (err as Error).message }, { status: 500 })
  }
}
