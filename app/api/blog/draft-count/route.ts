import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

export async function GET() {
  const session = await auth()
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const octokit = new Octokit({ auth: process.env.GH_PAT })

  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: 'content/drafts',
    })

    if (!Array.isArray(data)) return NextResponse.json({ count: 0 })

    // Count total markdown files across all week directories
    let count = 0
    await Promise.all(data.map(async (week) => {
      if (week.type !== 'dir') return
      try {
        const { data: files } = await octokit.repos.getContent({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          path: week.path,
        })
        if (Array.isArray(files)) {
          count += files.filter(f => f.name.endsWith('.md')).length
        }
      } catch { /* skip */ }
    }))

    // Read .last-generated timestamp to detect re-generation of same week
    let lastGenerated: string | null = null
    try {
      const { data: statusFile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path: 'content/drafts/.last-generated',
      })
      if (!Array.isArray(statusFile) && statusFile.type === 'file' && statusFile.content) {
        lastGenerated = Buffer.from(statusFile.content, 'base64').toString('utf-8').trim()
      }
    } catch { /* file doesn't exist yet */ }

    return NextResponse.json({ count, lastGenerated })
  } catch {
    return NextResponse.json({ count: 0, lastGenerated: null })
  }
}
