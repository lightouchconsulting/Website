import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function POST() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const octokit = new Octokit({ auth: process.env.GH_PAT })

  await octokit.actions.createWorkflowDispatch({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    workflow_id: 'blog-generator.yml',
    ref: 'main',
  })

  return NextResponse.json({ ok: true })
}
