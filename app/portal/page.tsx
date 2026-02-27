import { auth } from '@/auth'
import Link from 'next/link'
import fs from 'fs/promises'
import path from 'path'

async function getProjectName(slug: string): Promise<string> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'content', 'projects', slug, 'config.json'),
      'utf-8'
    )
    return JSON.parse(raw).name ?? slug
  } catch {
    return slug
  }
}

export default async function PortalPage() {
  const session = await auth()
  const projects = session?.user?.projects ?? []
  const projectNames = await Promise.all(projects.map(async slug => ({
    slug,
    name: await getProjectName(slug),
  })))

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-2">Portal</h1>
      <p className="text-gray-400 mb-10">Welcome, {session?.user?.name}</p>

      <div className="grid gap-4">
        <Link href="/portal/training" className="block p-4 border border-gray-700 rounded hover:border-white transition">
          <h2 className="font-semibold text-white">Training Videos</h2>
          <p className="text-sm text-gray-400">AI strategy and delivery training resources</p>
        </Link>
        <Link href="/portal/best-practices" className="block p-4 border border-gray-700 rounded hover:border-white transition">
          <h2 className="font-semibold text-white">Best Practices</h2>
          <p className="text-sm text-gray-400">Frameworks and guidance from Lightouch</p>
        </Link>
        {projectNames.map(({ slug, name }) => (
          <Link
            key={slug}
            href={`/portal/projects/${slug}`}
            className="block p-4 border border-gray-700 rounded hover:border-white transition"
          >
            <h2 className="font-semibold text-white">{name}</h2>
            <p className="text-sm text-gray-400">Project collaboration space</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
