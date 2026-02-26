# Roles & Access Design

**Date:** 2026-02-26
**Scope:** Admin portal, consultant portal, client portal — role model, URL access control, data model, UI

---

## Role Model

| Role | How Assigned | Description |
|------|-------------|-------------|
| `admin` | `ADMIN_LINKEDIN_IDS` env var | Blog approval + team/project setup |
| `consultant` | `CONSULTANT_LINKEDIN_IDS` env var | All Lightouch staff |
| `client` | `content/projects/<slug>/config.json` | Invited per-project |

**Role resolution at login (in order):**
1. LinkedIn ID in `ADMIN_LINKEDIN_IDS` → role: `admin`
2. LinkedIn ID in `CONSULTANT_LINKEDIN_IDS` → role: `consultant`
3. LinkedIn ID found in any project config → role: `client`
4. No match → access denied (401)

**JWT payload:** `{ role, linkedinId, projects: [slugs] }`
Projects array is populated by scanning all project configs at login time.

---

## URL Structure & Access Control

| Path | Admin | Consultant | Client | Public |
|------|-------|------------|--------|--------|
| `/` | ✓ | ✓ | ✓ | ✓ |
| `/blog` | ✓ | ✓ | ✓ | ✓ |
| `/blog/[slug]` | ✓ | ✓ | ✓ | ✓ |
| `/portal` | ✓ | ✓ | ✓ | — |
| `/portal/training` | ✓ | ✓ | ✓ | — |
| `/portal/best-practices` | ✓ | ✓ | ✓ | — |
| `/portal/projects/[slug]` | ✓ | if assigned | if assigned | — |
| `/admin` | ✓ | — | — | — |
| `/admin/drafts` | ✓ | — | — | — |
| `/admin/drafts/[week]/[slug]` | ✓ | — | — | — |
| `/admin/projects` | ✓ | — | — | — |
| `/admin/projects/[slug]` | ✓ | — | — | — |

**Project access rule:** a consultant or client can only access `/portal/projects/[slug]` if that slug is in their JWT `projects` array.

---

## Data Model (Files in Repo)

```
content/
├── projects/
│   └── acme-corp/
│       ├── config.json              # Team membership
│       └── collaboration/
│           └── 2026-02-26-kickoff.md  # Collaboration posts
├── training/
│   └── videos.json                  # Common to all portal users
└── best-practices/
    └── ai-governance.md             # Common to all portal users
```

**`content/projects/<slug>/config.json`:**
```json
{
  "name": "Acme Corp",
  "consultants": ["linkedin-id-1", "linkedin-id-2"],
  "clients": ["linkedin-id-3"]
}
```

**`content/training/videos.json`:**
```json
[
  {
    "title": "AI Strategy Foundations",
    "url": "https://...",
    "description": "..."
  }
]
```

All writes (create project, add/remove members, new collaboration post) go via the GitHub API — no separate backend needed.

---

## Admin UI

**`/admin/projects`**
- Lists all projects (reads `content/projects/*/config.json`)
- Create new project → creates config.json via GitHub API
- Delete project → removes directory via GitHub API

**`/admin/projects/[slug]`**
- Edit project name
- Add/remove consultants by LinkedIn ID
- Add/remove clients by LinkedIn ID
- View collaboration posts (read only)

---

## Portal UI

**`/portal`** — dashboard after login
- Links to Training, Best Practices, and assigned project spaces
- Clients only see their assigned projects; consultants see all assigned projects

**`/portal/training`**
- Renders video list from `content/training/videos.json`
- Common to all authenticated users

**`/portal/best-practices`**
- Renders Markdown files from `content/best-practices/`
- Common to all authenticated users

**`/portal/projects/[slug]`**
- Lists collaboration posts from `content/projects/[slug]/collaboration/*.md`
- Consultants: can create new posts (writes via GitHub API)
- Clients: read only (future spec may add client posting)

---

## Required Secrets

| Secret | Where |
|--------|-------|
| `CONSULTANT_LINKEDIN_IDS` | Vercel (comma-separated, same pattern as `ADMIN_LINKEDIN_IDS`) |

All other secrets are defined in the platform spec.
