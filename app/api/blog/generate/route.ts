import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const octokit = new Octokit({ auth: process.env.GH_PAT })

  try {
    await octokit.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      workflow_id: 'blog-generator.yml',
      ref: 'main',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('workflow dispatch failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
