import fs from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import NewProjectForm from './NewProjectForm'

interface ProjectMeta {
  slug: string
  name: string
  consultants: string[]
  clients: string[]
}

async function getProjects(): Promise<ProjectMeta[]> {
  const dir = path.join(process.cwd(), 'content', 'projects')
  try {
    const slugs = await fs.readdir(dir)
    const projects = await Promise.all(
      slugs.map(async slug => {
        try {
          const raw = await fs.readFile(path.join(dir, slug, 'config.json'), 'utf-8')
          return { slug, ...JSON.parse(raw) } as ProjectMeta
        } catch {
          return null
        }
      })
    )
    return projects.filter((p): p is ProjectMeta => p !== null)
  } catch {
    return []
  }
}

export default async function AdminProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Projects</h1>

      {projects.length === 0 ? (
        <p className="text-gray-500 mb-8">No projects yet.</p>
      ) : (
        <ul className="space-y-3 mb-12">
          {projects.map(p => (
            <li key={p.slug}>
              <Link
                href={`/admin/projects/${p.slug}`}
                className="flex items-center justify-between p-4 border border-gray-700 rounded hover:border-white transition"
              >
                <span className="font-semibold text-white">{p.name}</span>
                <span className="text-gray-400 text-sm">
                  {p.consultants.length} consultants · {p.clients.length} clients
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NewProjectForm />
    </div>
  )
}
