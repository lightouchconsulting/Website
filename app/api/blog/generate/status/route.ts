import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function GET() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const octokit = new Octokit({ auth: process.env.GH_PAT })

  const { data } = await octokit.actions.listWorkflowRuns({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    workflow_id: 'blog-generator.yml',
    per_page: 1,
  })

  const run = data.workflow_runs[0]
  if (!run) return NextResponse.json({ status: 'none' })

  return NextResponse.json({
    status: run.status,        // queued | in_progress | completed
    conclusion: run.conclusion, // success | failure | null
    started_at: run.run_started_at,
    html_url: run.html_url,
  })
}
