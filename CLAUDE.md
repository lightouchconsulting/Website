# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static marketing website for **Lightouch Consulting** — a GenAI-native consulting firm targeting CIOs and technology leaders. The site is a single HTML file with no build process.

## Architecture

**Single file:** `index.html` — the entire site lives here, including all inline styles, scripts, and markup.

**Tech stack (all via CDN, no installation required):**
- Tailwind CSS v3 (utility-first styling)
- Font Awesome 6.5.0 (icons)
- Vanilla ES6+ JavaScript (no framework)
- Formspree for form submission (`https://formspree.io/f/mvzalpbp`)

**Key JavaScript patterns in the file:**
- Intersection Observer for scroll-triggered fade-in animations on cards
- Mobile nav toggle with ARIA attributes
- Dynamic header shadow on scroll
- Fetch API form submission to Formspree with error handling

## Development

No build step. Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

## Site Structure

The page uses anchor-based navigation with these sections: Who We Are, What We Do, Methods & Tools, Values, Contact. The layout is fully responsive (mobile → desktop) using Tailwind breakpoints.

## Deployment

- **Repository:** https://github.com/lightouchconsulting/Website
- **Hosted on:** Vercel (custom domain), connected directly to the GitHub repo
- **Auto-deploy:** Every push to `main` deploys automatically — no manual steps

### Deploy an update
```bash
git add index.html
git commit -m "describe change"
git push origin main
```
Live in ~30 seconds.
