import fs from 'fs/promises'
import path from 'path'

export type Role = 'admin' | 'consultant' | 'client'

export interface ResolvedRole {
  role: Role
  projects: string[]
}

export async function resolveRole(linkedinId: string): Promise<ResolvedRole | null> {
  const adminIds = (process.env.ADMIN_LINKEDIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const consultantIds = (process.env.CONSULTANT_LINKEDIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

  if (adminIds.includes(linkedinId)) {
    return { role: 'admin', projects: [] }
  }

  if (consultantIds.includes(linkedinId)) {
    const projects = await getProjectSlugsForMember(linkedinId, 'consultants')
    return { role: 'consultant', projects }
  }

  const clientProjects = await getProjectSlugsForMember(linkedinId, 'clients')
  if (clientProjects.length > 0) {
    return { role: 'client', projects: clientProjects }
  }

  return null
}

async function getProjectSlugsForMember(
  linkedinId: string,
  memberType: 'consultants' | 'clients'
): Promise<string[]> {
  const projectsDir = path.join(process.cwd(), 'content', 'projects')
  try {
    const slugs = await fs.readdir(projectsDir)
    const matched: string[] = []
    for (const slug of slugs) {
      const configPath = path.join(projectsDir, slug, 'config.json')
      try {
        const raw = await fs.readFile(configPath, 'utf-8')
        const config = JSON.parse(raw)
        if ((config[memberType] ?? []).includes(linkedinId)) {
          matched.push(slug)
        }
      } catch {
        // skip missing or malformed config
      }
    }
    return matched
  } catch {
    return []
  }
}
