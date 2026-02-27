import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import fs from 'fs/promises'
import path from 'path'
import { updateFile } from '@/lib/github'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  if (!/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const { memberType, action, linkedinId } = await request.json()
  if (!['consultants', 'clients'].includes(memberType)) {
    return NextResponse.json({ error: 'Invalid memberType' }, { status: 400 })
  }
  if (!['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (!linkedinId || typeof linkedinId !== 'string') {
    return NextResponse.json({ error: 'linkedinId required' }, { status: 400 })
  }

  const configPath = path.join(process.cwd(), 'content', 'projects', slug, 'config.json')
  let config: { name: string; consultants: string[]; clients: string[] }
  try {
    const raw = await fs.readFile(configPath, 'utf-8')
    config = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (action === 'add' && !config[memberType as 'consultants' | 'clients'].includes(linkedinId)) {
    config[memberType as 'consultants' | 'clients'].push(linkedinId)
  } else if (action === 'remove') {
    config[memberType as 'consultants' | 'clients'] = config[memberType as 'consultants' | 'clients'].filter(
      id => id !== linkedinId
    )
  }

  await updateFile(
    `content/projects/${slug}/config.json`,
    JSON.stringify(config, null, 2),
    `feat: ${action} ${linkedinId} to ${memberType} for project ${slug}`
  )

  return NextResponse.json({ ok: true })
}
