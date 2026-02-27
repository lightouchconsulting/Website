import fs from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MemberManager from './MemberManager'

async function getProject(slug: string) {
  const configPath = path.join(process.cwd(), 'content', 'projects', slug, 'config.json')
  try {
    const raw = await fs.readFile(configPath, 'utf-8')
    return { slug, ...JSON.parse(raw) } as {
      slug: string
      name: string
      consultants: string[]
      clients: string[]
    }
  } catch {
    return null
  }
}

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <Link href="/admin/projects" className="text-sm text-gray-400 hover:text-white mb-8 inline-block">
        ← Back to Projects
      </Link>
      <h1 className="text-3xl font-bold text-white mb-8">{project.name}</h1>

      <MemberManager slug={project.slug} memberType="consultants" members={project.consultants} />
      <MemberManager slug={project.slug} memberType="clients" members={project.clients} />
    </div>
  )
}
