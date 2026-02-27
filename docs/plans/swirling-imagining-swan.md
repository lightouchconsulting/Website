# Plan: Lightouch Platform — Next.js Migration + Blog Generator + Portal (No Database)

## Context
The current static `index.html` evolves into a full-stack Next.js platform. Blog posts are stored as **Markdown files in the GitHub repo** — no external database required. Auth uses **NextAuth.js with JWT sessions** (stateless). Admin role is managed via an environment variable whitelist of LinkedIn IDs.

---

## URL Structure

| Path | Access |
|------|--------|
| `/` | Public — marketing site |
| `/blog` | Public — published posts |
| `/blog/[slug]` | Public — individual post |
| `/admin` | LinkedIn login → admin role only |
| `/admin/drafts` | List of draft posts pending review |
| `/admin/drafts/[slug]` | Review, edit, approve or reject |
| `/portal` | LinkedIn login → consultant or client role — dashboard |
| `/portal/training` | Training videos (all authenticated users) |
| `/portal/best-practices` | Best practices articles (all authenticated users) |
| `/portal/best-practices/[slug]` | Individual best practice article |
| `/portal/projects/[slug]` | Project collaboration space (assigned team only) |
| `/admin/projects` | Admin: list and create projects |
| `/admin/projects/[slug]` | Admin: manage project team members |

**Role routing:** After LinkedIn login:
- LinkedIn ID in `ADMIN_LINKEDIN_IDS` → role: `admin` → `/admin`
- LinkedIn ID in `CONSULTANT_LINKEDIN_IDS` → role: `consultant` → `/portal`
- LinkedIn ID in any `content/projects/*/config.json` clients array → role: `client` → `/portal`
- Unknown → access denied (redirected to `/login`)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 14** (App Router) on Vercel |
| Auth | **NextAuth.js v5** — LinkedIn OAuth + JWT (no DB adapter) |
| Admin access | `ADMIN_LINKEDIN_IDS` env var (comma-separated LinkedIn IDs) |
| Content storage | **Markdown files in the repo** — no external DB |
| Styling | **Tailwind CSS** (already used) |
| Blog generation | Node.js script via **GitHub Actions** (weekly cron) |
| AI | **Claude claude-sonnet-4-6** via `@anthropic-ai/sdk` |
| Hosting | **Vercel** (existing, GitHub-connected) |

---

## Content Storage (Git as CMS)

```
content/
├── drafts/
│   └── 2026-W09/
│       ├── strategy.md
│       ├── management.md
│       ├── architecture.md
│       ├── development.md
│       ├── delivery.md
│       ├── risk.md
│       └── operations.md
├── posts/
│   └── 2026-W09-strategy-ai-governance.md
├── projects/
│   └── [slug]/
│       ├── config.json           # { name, consultants: [], clients: [] }
│       └── collaboration/        # Markdown posts by consultants
├── training/
│   └── videos.json               # Video catalog for portal
└── best-practices/
    └── [slug].md                 # Best practice articles for portal
```

**Markdown frontmatter:**
```markdown
---
title: "AI-Driven Governance: What CIOs Need This Week"
slug: 2026-W09-strategy-ai-governance
theme: Strategy
subThemes: [Business Alignment, Innovation]
weekLabel: 2026-W09
sources:
  - title: "Article Title"
    url: https://...
    source: McKinsey Insights
status: draft   # or published
---
```

---

## Repository Structure

```
lightouchconsulting/Website
├── app/
│   ├── page.tsx                        # Marketing site (migrated from index.html)
│   ├── blog/
│   │   ├── page.tsx                    # Blog listing (reads content/posts/)
│   │   └── [slug]/page.tsx             # Individual post
│   ├── admin/
│   │   ├── layout.tsx                  # Auth guard: admin role only
│   │   ├── page.tsx                    # Dashboard
│   │   └── drafts/
│   │       ├── page.tsx                # Drafts list (reads content/drafts/)
│   │       └── [week]/[slug]/page.tsx  # Review + approve/reject
│   ├── portal/
│   │   ├── layout.tsx                  # Auth guard: any logged-in user
│   │   └── page.tsx                    # Customer home (TBD)
│   └── api/
│       ├── auth/[...nextauth]/route.ts # NextAuth LinkedIn OAuth
│       └── blog/
│           ├── approve/route.ts        # Move draft → posts/ via GitHub API
│           └── reject/route.ts         # Delete draft via GitHub API
├── content/
│   ├── drafts/                         # Created by blog generator
│   └── posts/                          # Approved and published posts
├── blog-generator/
│   ├── index.ts                        # Orchestrator
│   ├── scraper.ts                      # RSS feed fetcher (rss-parser)
│   ├── classifier.ts                   # Claude: tag articles by theme
│   ├── synthesizer.ts                  # Claude: write post per theme
│   └── config/
│       ├── blogs.json                  # 50 RSS feed URLs
│       └── themes.json                 # 7 themes + sub-themes
└── .github/workflows/
    └── blog-generator.yml              # Weekly cron
```

---

## Auth Flow

1. User visits `/admin` or `/portal`
2. NextAuth redirects to LinkedIn OAuth
3. On callback: LinkedIn ID resolved via `lib/roles.ts` — checks `ADMIN_LINKEDIN_IDS`, then `CONSULTANT_LINKEDIN_IDS`, then scans `content/projects/*/config.json` client arrays
4. JWT session created with `{ role: "admin"|"consultant"|"client", linkedinId, projects: string[] }`
5. Middleware enforces routing: admin → `/admin/*`; consultant/client → `/portal/*`; project pages check `projects` array in JWT

No user table. No session table. Fully stateless JWT.

---

## Blog Generation Pipeline

**Trigger:** Every Monday 6:00 AM UTC via GitHub Actions + manual `workflow_dispatch`

```
blog-generator/index.ts
  ↓
scraper.ts      — fetch articles from 50 RSS feeds (last 7 days)
  ↓
classifier.ts   — Claude tags each article with 1 of 7 themes
  ↓
synthesizer.ts  — Claude writes ~600 word original post per theme
  ↓
Commit 7 Markdown files to content/drafts/YYYY-WW/ on main branch
  ↓
Vercel rebuilds → drafts visible in /admin/drafts (admin only)
```

**GitHub Actions secrets:**
- `ANTHROPIC_API_KEY`
- `GH_PAT` (GitHub Personal Access Token to commit files)

---

## Draft Approval Flow

Admin visits `/admin/drafts/[week]/[slug]`:
- Sees full post preview with source articles listed
- **Approve** → POST `/api/blog/approve` → GitHub API moves file to `content/posts/` → Vercel rebuilds → post live on `/blog`
- **Reject** → POST `/api/blog/reject` → GitHub API deletes draft file
- **Edit** → Inline edit before approving (updates file content via GitHub API)

---

## The 7 Themes (themes.json)

| Theme | Sub-themes |
|-------|-----------|
| Strategy | Business Alignment, Target Operating Model, Cloud Migration, Service Strategy, Innovation |
| Management | Governance & Risk Management, Target Operating Model, Application Selection, Capability Roadmap, Performance Improvement |
| Architecture | Business Architecture, Application Architecture, Data Architecture, Infrastructure Architecture, Roadmap & Governance |
| Development | Analysis, Specification, Design, Validation, Change Management |
| Delivery | Initiation, Plan, Execute, Monitor, Close |
| Risk | Threat & Vulnerability, Access Control & IAM, Data Security & Privacy, Application & Infrastructure, Compliance Management |
| Operations | Planning, Design, Transition, Issue & Problem, Performance Improvement |

---

## Build Phases

1. **Scaffold Next.js** — migrate `index.html` to `app/page.tsx`, set up Tailwind
2. **Auth** — NextAuth LinkedIn OAuth, JWT sessions, admin whitelist middleware
3. **Blog public pages** — `/blog` + `/blog/[slug]` reading from `content/posts/`
4. **Admin portal** — `/admin/drafts` + review/approve UI + GitHub API integration
5. **Blog generator** — scraper → classifier → synthesizer → commits to `content/drafts/`
6. **GitHub Action** — weekly cron running the generator
7. **Portal** — `/portal` with three-role auth guard (consultant + client); dashboard with training videos, best practices, and per-user project spaces; consultants can post to project collaboration spaces; clients are read-only; admin manages project team membership via `/admin/projects`

---

## Required Secrets

| Secret | Where |
|--------|-------|
| `LINKEDIN_CLIENT_ID` | Vercel + GitHub |
| `LINKEDIN_CLIENT_SECRET` | Vercel + GitHub |
| `NEXTAUTH_SECRET` | Vercel |
| `ADMIN_LINKEDIN_IDS` | Vercel (comma-separated LinkedIn IDs) |
| `CONSULTANT_LINKEDIN_IDS` | Vercel (comma-separated LinkedIn IDs of Lightouch consultants) |
| `ANTHROPIC_API_KEY` | GitHub Actions |
| `GH_PAT` | GitHub Actions + Vercel (for file commits/moves) |

---

## Verification

1. `npm run dev` → marketing site renders correctly
2. LinkedIn login with admin ID → lands on `/admin`; non-admin → `/portal`
3. Run `npx ts-node blog-generator/index.ts` locally → 7 Markdown files created in `content/drafts/`
4. Visit `/admin/drafts` → drafts visible; approve one → appears on `/blog`
5. Trigger GitHub Action manually → new drafts committed and visible in admin
6. Push to `main` → Vercel auto-deploys
