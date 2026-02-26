# Roles & Access Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three-role access control (admin, consultant, client) across the admin portal and client portal, with project-scoped team spaces and common shared content areas.

**Architecture:** Roles are resolved at LinkedIn OAuth login — admin and consultant LinkedIn IDs come from env vars, client IDs are embedded in per-project `config.json` files in the repo. The JWT payload carries `{ role, linkedinId, projects }` and Next.js middleware enforces route access. All writes (project creation, team membership, collaboration posts) go via the GitHub API — no database.

**Tech Stack:** Next.js 14 App Router, NextAuth.js v5, TypeScript, Tailwind CSS, gray-matter (frontmatter parsing), GitHub REST API via `@octokit/rest`

**Prerequisites:** Main platform plan Phases 1–2 complete — Next.js scaffold exists, NextAuth LinkedIn OAuth is wired up, basic middleware exists. If starting fresh, complete those first.

---

## Task 1: Update Role Resolution in NextAuth

**Goal:** Resolve `admin`, `consultant`, or `client` role from LinkedIn ID at login. Scan project configs to find client project memberships.

**Files:**
- Modify: `app/api/auth/[...nextauth]/route.ts`
- Create: `lib/roles.ts`
- Create: `lib/roles.test.ts`

**Step 1: Write failing tests for role resolution**

Create `lib/roles.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveRole } from './roles'

describe('resolveRole', () => {
  beforeEach(() => {
    process.env.ADMIN_LINKEDIN_IDS = 'admin-123,admin-456'
    process.env.CONSULTANT_LINKEDIN_IDS = 'consultant-789,consultant-012'
  })

  it('returns admin role for admin LinkedIn ID', async () => {
    const result = await resolveRole('admin-123')
    expect(result.role).toBe('admin')
    expect(result.projects).toEqual([])
  })

  it('returns consultant role for consultant LinkedIn ID', async () => {
    const result = await resolveRole('consultant-789')
    expect(result.role).toBe('consultant')
  })

  it('returns client role with projects for known client', async () => {
    // Mock fs to return a project config
    vi.mock('fs/promises', () => ({
      readdir: vi.fn().mockResolvedValue(['acme-corp']),
      readFile: vi.fn().mockResolvedValue(JSON.stringify({
        name: 'Acme Corp',
        consultants: ['consultant-789'],
        clients: ['client-555']
      }))
    }))
    const result = await resolveRole('client-555')
    expect(result.role).toBe('client')
    expect(result.projects).toContain('acme-corp')
  })

  it('returns null for unknown LinkedIn ID', async () => {
    const result = await resolveRole('unknown-999')
    expect(result).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run lib/roles.test.ts
```
Expected: FAIL — `resolveRole` not found

**Step 3: Implement `lib/roles.ts`**

```typescript
import fs from 'fs/promises'
import path from 'path'

type Role = 'admin' | 'consultant' | 'client'

interface ResolvedRole {
  role: Role
  projects: string[]
}

export async function resolveRole(linkedinId: string): Promise<ResolvedRole | null> {
  const adminIds = (process.env.ADMIN_LINKEDIN_IDS ?? '').split(',').map(s => s.trim())
  const consultantIds = (process.env.CONSULTANT_LINKEDIN_IDS ?? '').split(',').map(s => s.trim())

  if (adminIds.includes(linkedinId)) {
    return { role: 'admin', projects: [] }
  }

  if (consultantIds.includes(linkedinId)) {
    const projects = await getProjectsForMember(linkedinId, 'consultants')
    return { role: 'consultant', projects }
  }

  const clientProjects = await getProjectsForMember(linkedinId, 'clients')
  if (clientProjects.length > 0) {
    return { role: 'client', projects: clientProjects }
  }

  return null
}

async function getProjectsForMember(linkedinId: string, memberType: 'consultants' | 'clients'): Promise<string[]> {
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
        // skip malformed or missing config
      }
    }
    return matched
  } catch {
    return []
  }
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/roles.test.ts
```
Expected: PASS (4 tests)

**Step 5: Wire `resolveRole` into NextAuth JWT callback**

In `app/api/auth/[...nextauth]/route.ts`, update the `jwt` callback:

```typescript
import { resolveRole } from '@/lib/roles'

// Inside NextAuth config:
callbacks: {
  async jwt({ token, profile }) {
    if (profile) {
      // profile.sub is the LinkedIn ID
      const resolved = await resolveRole(profile.sub as string)
      if (!resolved) {
        throw new Error('ACCESS_DENIED')
      }
      token.role = resolved.role
      token.linkedinId = profile.sub
      token.projects = resolved.projects
    }
    return token
  },
  async session({ session, token }) {
    session.user.role = token.role as string
    session.user.linkedinId = token.linkedinId as string
    session.user.projects = token.projects as string[]
    return session
  }
}
```

**Step 6: Update NextAuth type augmentation**

In `types/next-auth.d.ts` (create if it doesn't exist):

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'admin' | 'consultant' | 'client'
      linkedinId: string
      projects: string[]
    }
  }
}
```

**Step 7: Commit**

```bash
git add lib/roles.ts lib/roles.test.ts app/api/auth types/next-auth.d.ts
git commit -m "feat: add three-role resolution (admin/consultant/client) at login"
```

---

## Task 2: Update Middleware for Three-Role Routing

**Goal:** Protect routes based on role. Admin → `/admin/*`. Consultant + client → `/portal/*`. Project pages check `projects` array in JWT.

**Files:**
- Modify: `middleware.ts`
- Create: `middleware.test.ts`

**Step 1: Write failing tests**

Create `middleware.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getRedirectForRole } from './middleware'

describe('getRedirectForRole', () => {
  it('redirects unauthenticated user to /api/auth/signin from /admin', () => {
    expect(getRedirectForRole(null, '/admin')).toBe('/api/auth/signin')
  })

  it('allows admin to access /admin', () => {
    expect(getRedirectForRole({ role: 'admin', projects: [] }, '/admin')).toBeNull()
  })

  it('blocks consultant from /admin', () => {
    expect(getRedirectForRole({ role: 'consultant', projects: [] }, '/admin')).toBe('/portal')
  })

  it('allows consultant to access /portal', () => {
    expect(getRedirectForRole({ role: 'consultant', projects: [] }, '/portal')).toBeNull()
  })

  it('allows client to access assigned project', () => {
    expect(getRedirectForRole({ role: 'client', projects: ['acme-corp'] }, '/portal/projects/acme-corp')).toBeNull()
  })

  it('blocks client from unassigned project', () => {
    expect(getRedirectForRole({ role: 'client', projects: ['acme-corp'] }, '/portal/projects/other-co')).toBe('/portal')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run middleware.test.ts
```
Expected: FAIL — `getRedirectForRole` not found

**Step 3: Implement `getRedirectForRole` and update `middleware.ts`**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

interface TokenPayload {
  role: 'admin' | 'consultant' | 'client'
  projects: string[]
}

export function getRedirectForRole(token: TokenPayload | null, pathname: string): string | null {
  if (!token) return '/api/auth/signin'

  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    return '/portal'
  }

  if (pathname.startsWith('/portal/projects/')) {
    const slug = pathname.split('/portal/projects/')[1]?.split('/')[0]
    if (slug && token.role !== 'admin' && !token.projects.includes(slug)) {
      return '/portal'
    }
  }

  return null
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request }) as TokenPayload | null
  const { pathname } = request.nextUrl

  const redirect = getRedirectForRole(token, pathname)
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*']
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run middleware.test.ts
```
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add middleware.ts middleware.test.ts
git commit -m "feat: update middleware for three-role route protection"
```

---

## Task 3: Seed Content Directory Structure

**Goal:** Create the content directory structure for projects, training, and best practices with sample data.

**Files:**
- Create: `content/projects/sample-project/config.json`
- Create: `content/projects/sample-project/collaboration/.gitkeep`
- Create: `content/training/videos.json`
- Create: `content/best-practices/ai-governance.md`

**Step 1: Create sample project config**

Create `content/projects/sample-project/config.json`:

```json
{
  "name": "Sample Project",
  "consultants": [],
  "clients": []
}
```

**Step 2: Create training videos seed data**

Create `content/training/videos.json`:

```json
[
  {
    "title": "AI Strategy Foundations",
    "url": "https://www.youtube.com/embed/placeholder",
    "description": "An introduction to building AI strategy for technology leaders."
  }
]
```

**Step 3: Create sample best practices post**

Create `content/best-practices/ai-governance.md`:

```markdown
---
title: "AI Governance: A CIO Checklist"
date: "2026-02-26"
---

# AI Governance: A CIO Checklist

Best practice content goes here.
```

**Step 4: Create collaboration placeholder**

```bash
mkdir -p content/projects/sample-project/collaboration
touch content/projects/sample-project/collaboration/.gitkeep
```

**Step 5: Commit**

```bash
git add content/
git commit -m "feat: seed content directory structure for projects, training, best-practices"
```

---

## Task 4: Admin — Project List Page

**Goal:** `/admin/projects` lists all projects and has a "New Project" form that creates a `config.json` via the GitHub API.

**Files:**
- Create: `app/admin/projects/page.tsx`
- Create: `app/api/projects/route.ts`
- Create: `lib/github.ts` (GitHub API helper, may already exist for blog approval)

**Step 1: Implement GitHub API helper (if not already present)**

Create `lib/github.ts`:

```typescript
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GH_PAT })
const owner = process.env.GITHUB_OWNER ?? 'lightouchconsulting'
const repo = process.env.GITHUB_REPO ?? 'Website'

export async function createFile(path: string, content: string, message: string) {
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path,
    message,
    content: Buffer.from(content).toString('base64'),
  })
}

export async function updateFile(path: string, content: string, message: string) {
  const { data } = await octokit.repos.getContent({ owner, repo, path })
  const sha = (data as { sha: string }).sha
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path, message, sha,
    content: Buffer.from(content).toString('base64'),
  })
}

export async function deleteFile(path: string, message: string) {
  const { data } = await octokit.repos.getContent({ owner, repo, path })
  const sha = (data as { sha: string }).sha
  await octokit.repos.deleteFile({ owner, repo, path, message, sha })
}
```

**Step 2: Implement API route for project creation**

Create `app/api/projects/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createFile } from '@/lib/github'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, slug } = await request.json()
  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }

  const config = { name, consultants: [], clients: [] }
  await createFile(
    `content/projects/${slug}/config.json`,
    JSON.stringify(config, null, 2),
    `feat: create project ${name}`
  )

  return NextResponse.json({ ok: true })
}
```

**Step 3: Implement the page**

Create `app/admin/projects/page.tsx`:

```tsx
import fs from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import NewProjectForm from './NewProjectForm'

async function getProjects() {
  const dir = path.join(process.cwd(), 'content', 'projects')
  try {
    const slugs = await fs.readdir(dir)
    return await Promise.all(slugs.map(async (slug) => {
      const raw = await fs.readFile(path.join(dir, slug, 'config.json'), 'utf-8')
      return { slug, ...JSON.parse(raw) }
    }))
  } catch {
    return []
  }
}

export default async function AdminProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      <ul className="space-y-3 mb-10">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/admin/projects/${p.slug}`} className="text-blue-600 hover:underline">
              {p.name}
            </Link>
            <span className="text-gray-400 text-sm ml-2">
              {p.consultants.length} consultants · {p.clients.length} clients
            </span>
          </li>
        ))}
      </ul>
      <NewProjectForm />
    </div>
  )
}
```

Create `app/admin/projects/NewProjectForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectForm() {
  const [name, setName] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug })
    })
    router.refresh()
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New project name"
        className="border rounded px-3 py-2 flex-1"
        required
      />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        Create
      </button>
    </form>
  )
}
```

**Step 4: Manually verify**

```bash
npm run dev
```
- Log in as admin
- Visit `http://localhost:3000/admin/projects`
- Create a new project — verify `config.json` is committed to repo

**Step 5: Commit**

```bash
git add app/admin/projects/ app/api/projects/ lib/github.ts
git commit -m "feat: add admin project list page with create form"
```

---

## Task 5: Admin — Project Detail Page

**Goal:** `/admin/projects/[slug]` allows admin to add/remove consultants and clients by LinkedIn ID.

**Files:**
- Create: `app/admin/projects/[slug]/page.tsx`
- Create: `app/api/projects/[slug]/members/route.ts`

**Step 1: Implement API route for managing members**

Create `app/api/projects/[slug]/members/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import fs from 'fs/promises'
import path from 'path'
import { updateFile } from '@/lib/github'

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { memberType, action, linkedinId } = await request.json()
  // memberType: 'consultants' | 'clients'
  // action: 'add' | 'remove'

  const configPath = path.join(process.cwd(), 'content', 'projects', params.slug, 'config.json')
  const raw = await fs.readFile(configPath, 'utf-8')
  const config = JSON.parse(raw)

  if (action === 'add' && !config[memberType].includes(linkedinId)) {
    config[memberType].push(linkedinId)
  } else if (action === 'remove') {
    config[memberType] = config[memberType].filter((id: string) => id !== linkedinId)
  }

  await updateFile(
    `content/projects/${params.slug}/config.json`,
    JSON.stringify(config, null, 2),
    `feat: update ${memberType} for project ${params.slug}`
  )

  return NextResponse.json({ ok: true })
}
```

**Step 2: Implement the page**

Create `app/admin/projects/[slug]/page.tsx`:

```tsx
import fs from 'fs/promises'
import path from 'path'
import MemberManager from './MemberManager'

async function getProject(slug: string) {
  const configPath = path.join(process.cwd(), 'content', 'projects', slug, 'config.json')
  const raw = await fs.readFile(configPath, 'utf-8')
  return { slug, ...JSON.parse(raw) }
}

export default async function AdminProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProject(params.slug)

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">{project.name}</h1>
      <MemberManager slug={project.slug} memberType="consultants" members={project.consultants} />
      <MemberManager slug={project.slug} memberType="clients" members={project.clients} />
    </div>
  )
}
```

Create `app/admin/projects/[slug]/MemberManager.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  memberType: 'consultants' | 'clients'
  members: string[]
}

export default function MemberManager({ slug, memberType, members }: Props) {
  const [newId, setNewId] = useState('')
  const router = useRouter()

  async function modify(action: 'add' | 'remove', linkedinId: string) {
    await fetch(`/api/projects/${slug}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberType, action, linkedinId })
    })
    router.refresh()
    setNewId('')
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold capitalize mb-3">{memberType}</h2>
      <ul className="space-y-1 mb-4">
        {members.map(id => (
          <li key={id} className="flex items-center gap-2">
            <span className="font-mono text-sm">{id}</span>
            <button onClick={() => modify('remove', id)} className="text-red-500 text-xs hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={e => { e.preventDefault(); modify('add', newId) }} className="flex gap-2">
        <input
          value={newId}
          onChange={e => setNewId(e.target.value)}
          placeholder="LinkedIn ID"
          className="border rounded px-3 py-2 flex-1 font-mono text-sm"
          required
        />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded text-sm">
          Add
        </button>
      </form>
    </section>
  )
}
```

**Step 3: Manually verify**

- Visit `/admin/projects/sample-project`
- Add a LinkedIn ID to consultants — verify `config.json` is updated in repo
- Remove it — verify removal

**Step 4: Commit**

```bash
git add app/admin/projects/[slug]/ app/api/projects/
git commit -m "feat: add admin project detail page for managing team members"
```

---

## Task 6: Portal — Dashboard + Training + Best Practices

**Goal:** Build the portal landing page, training video library, and best practices listing.

**Files:**
- Create: `app/portal/page.tsx`
- Create: `app/portal/training/page.tsx`
- Create: `app/portal/best-practices/page.tsx`

**Step 1: Portal dashboard**

Create `app/portal/page.tsx`:

```tsx
import { getServerSession } from 'next-auth'
import Link from 'next/link'

export default async function PortalPage() {
  const session = await getServerSession()
  const projects = session?.user?.projects ?? []

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Portal</h1>
      <p className="text-gray-500 mb-8">Welcome, {session?.user?.name}</p>

      <div className="grid gap-4">
        <Link href="/portal/training" className="block p-4 border rounded hover:border-black transition">
          <h2 className="font-semibold">Training Videos</h2>
          <p className="text-sm text-gray-500">AI strategy and delivery training resources</p>
        </Link>
        <Link href="/portal/best-practices" className="block p-4 border rounded hover:border-black transition">
          <h2 className="font-semibold">Best Practices</h2>
          <p className="text-sm text-gray-500">Frameworks and guidance from Lightouch</p>
        </Link>
        {projects.map(slug => (
          <Link key={slug} href={`/portal/projects/${slug}`} className="block p-4 border rounded hover:border-black transition">
            <h2 className="font-semibold capitalize">{slug.replace(/-/g, ' ')}</h2>
            <p className="text-sm text-gray-500">Project collaboration space</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Training videos page**

Create `app/portal/training/page.tsx`:

```tsx
import fs from 'fs/promises'
import path from 'path'

interface Video {
  title: string
  url: string
  description: string
}

async function getVideos(): Promise<Video[]> {
  const filePath = path.join(process.cwd(), 'content', 'training', 'videos.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

export default async function TrainingPage() {
  const videos = await getVideos()

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Training Videos</h1>
      <div className="space-y-8">
        {videos.map((video, i) => (
          <div key={i}>
            <h2 className="font-semibold mb-2">{video.title}</h2>
            <p className="text-gray-500 text-sm mb-3">{video.description}</p>
            <iframe
              src={video.url}
              className="w-full aspect-video rounded"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Best practices page**

Create `app/portal/best-practices/page.tsx`:

```tsx
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

async function getPosts() {
  const dir = path.join(process.cwd(), 'content', 'best-practices')
  const files = await fs.readdir(dir)
  return files
    .filter(f => f.endsWith('.md'))
    .map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), 'utf-8')
      const { data } = matter(raw)
      return { slug: file.replace('.md', ''), ...data }
    })
}

export default async function BestPracticesPage() {
  const posts = await Promise.all(await getPosts())

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Best Practices</h1>
      <ul className="space-y-4">
        {posts.map((post: any) => (
          <li key={post.slug}>
            <Link href={`/portal/best-practices/${post.slug}`} className="text-blue-600 hover:underline font-medium">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Step 4: Manually verify**

```bash
npm run dev
```
- Log in as consultant → portal dashboard shows Training, Best Practices, and assigned projects
- Log in as client → same, but only their assigned projects appear

**Step 5: Commit**

```bash
git add app/portal/
git commit -m "feat: add portal dashboard, training, and best-practices pages"
```

---

## Task 7: Portal — Project Collaboration Space

**Goal:** `/portal/projects/[slug]` shows collaboration posts. Consultants can create new posts.

**Files:**
- Create: `app/portal/projects/[slug]/page.tsx`
- Create: `app/api/projects/[slug]/posts/route.ts`

**Step 1: Implement API route for creating collaboration posts**

Create `app/api/projects/[slug]/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createFile } from '@/lib/github'

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession()
  const role = session?.user?.role
  if (role !== 'admin' && role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body } = await request.json()
  const date = new Date().toISOString().split('T')[0]
  const filename = `${date}-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.md`

  const content = `---\ntitle: "${title}"\ndate: "${date}"\nauthor: "${session?.user?.name}"\n---\n\n${body}`

  await createFile(
    `content/projects/${params.slug}/collaboration/${filename}`,
    content,
    `feat: add collaboration post "${title}" to ${params.slug}`
  )

  return NextResponse.json({ ok: true })
}
```

**Step 2: Implement the page**

Create `app/portal/projects/[slug]/page.tsx`:

```tsx
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { getServerSession } from 'next-auth'
import NewPostForm from './NewPostForm'

async function getPosts(slug: string) {
  const dir = path.join(process.cwd(), 'content', 'projects', slug, 'collaboration')
  try {
    const files = await fs.readdir(dir)
    return await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8')
        const { data, content } = matter(raw)
        return { ...data, content }
      })
    )
  } catch {
    return []
  }
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession()
  const posts = await getPosts(params.slug)
  const canPost = session?.user?.role === 'admin' || session?.user?.role === 'consultant'

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2 capitalize">{params.slug.replace(/-/g, ' ')}</h1>
      <p className="text-gray-500 mb-8">Project collaboration space</p>

      {canPost && <NewPostForm slug={params.slug} />}

      <div className="space-y-8 mt-8">
        {posts.length === 0 && <p className="text-gray-400">No posts yet.</p>}
        {(posts as any[]).map((post, i) => (
          <article key={i} className="border-b pb-6">
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-xs text-gray-400 mb-3">{post.date} · {post.author}</p>
            <div className="prose prose-sm">{post.content}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
```

Create `app/portal/projects/[slug]/NewPostForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPostForm({ slug }: { slug: string }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch(`/api/projects/${slug}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    })
    router.refresh()
    setTitle('')
    setBody('')
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4 space-y-3">
      <h2 className="font-semibold">New Post</h2>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border rounded px-3 py-2"
        required
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your post..."
        className="w-full border rounded px-3 py-2 h-32"
        required
      />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded text-sm">
        Post
      </button>
    </form>
  )
}
```

**Step 3: Manually verify**

- Log in as consultant → visit a project space → create a post → verify Markdown file committed to repo
- Log in as client → same project → can see posts but no form shown
- Log in as client → visit a different (unassigned) project → redirected to `/portal`

**Step 4: Commit**

```bash
git add app/portal/projects/ app/api/projects/
git commit -m "feat: add portal project collaboration space with consultant posting"
```

---

## Task 8: Update Main Platform Spec

**Goal:** Update the main spec (`/Users/christopherneilon/.claude/plans/swirling-imagining-swan.md`) to reflect the finalised role model and replace the TBD portal section.

**Step 1: Update the spec**

In `/Users/christopherneilon/.claude/plans/swirling-imagining-swan.md`:

- Replace `role: "customer"` with the three-role model
- Update Build Phase 7 to reference the portal features (training, best practices, project spaces)
- Add `CONSULTANT_LINKEDIN_IDS` to the Required Secrets table

**Step 2: Commit**

```bash
git add docs/plans/
git commit -m "docs: update platform spec to reflect finalised role model and portal features"
```

---

## Verification Checklist

1. `npm run dev` — site loads, marketing page renders
2. LinkedIn login with admin ID → `/admin`; consultant ID → `/portal`; client ID with project assigned → `/portal` showing their project; unknown ID → 401
3. Admin creates a project at `/admin/projects` → `config.json` committed
4. Admin adds consultant + client LinkedIn IDs → `config.json` updated
5. Consultant visits `/portal/projects/[slug]` → sees posts, can create new one
6. Client visits same project → sees posts, no form
7. Client visits unassigned project → redirected to `/portal`

---

## Required Secrets (additions to main spec)

| Secret | Where |
|--------|-------|
| `CONSULTANT_LINKEDIN_IDS` | Vercel (comma-separated LinkedIn IDs) |
