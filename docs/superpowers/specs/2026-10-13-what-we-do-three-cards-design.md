# What We Do: Six Cards to Three Cards

## Problem

The "What We Do" section (`app/page.tsx`, `id="what"`, lines 125-188) currently renders two
separate rows of three cards each — six cards total:

- **"Who we are" row** (lines 134-150): Built for CIOs, GenAI + Expertise, Enablement First.
- **"Services" row** (lines 153-169): Technology & Digital Transformation, GenAI-Enabled
  Delivery, GenAI Adoption Support.

There is no separate "Who We Are" section elsewhere on the page — this is the only place that
content lives. The user wants this reduced to a single row of three cards with new, richer
copy for each.

## Design

### Structure

Remove the "Who we are" row (lines 134-150) entirely. Replace the three cards in the
"Services" row (lines 153-169) with the following content, keeping the same card markup
pattern (`fade-card p-6 bg-gray-900 rounded-2xl shadow-lg`, icon + heading + body) and the same
three icons in the same order, since the new topics map 1:1 to the existing ones:

1. **Technology and digital transformation** (icon: `fa-diagram-project`)
   - Description: "Modernise your technology, streamline operations and unlock new value."
   - Examples: "cloud, platforms, data, operating model, transformation strategy."

2. **GenAI-enabled consulting and delivery** (icon: `fa-file-signature`)
   - Description: "Turn AI potential into real business outcomes, faster."
   - Examples: "use case discovery, solution design, rapid delivery, change support."

3. **GenAI adoption and enablement** (icon: `fa-bolt`)
   - Description: "Build the skills, processes and culture to adopt and scale GenAI with
     confidence."
   - Examples: "enablement programmes, training, governance, operating models."

### Card markup shape

Each card keeps the existing icon + `<h3>` heading structure, with two paragraphs of body
text instead of one:

```tsx
<div className="fade-card p-6 bg-gray-900 rounded-2xl shadow-lg">
  <i className="fa-solid fa-diagram-project text-white-400 text-4xl mb-4"></i>
  <h3 className="text-xl font-semibold mb-2">Technology and digital transformation</h3>
  <p className="text-gray-400">Modernise your technology, streamline operations and unlock new value.</p>
  <p className="text-sm text-gray-500 mt-2">Examples: cloud, platforms, data, operating model, transformation strategy.</p>
</div>
```

The "Examples:" line renders smaller and more muted (`text-sm text-gray-500`) than the main
description (`text-gray-400`), as supporting detail rather than equal-weight content.

### Unchanged

- The intro paragraph above the cards ("Lightouch helps CIOs and technology leaders achieve
  rapid, high-quality results using GenerativeAI.") stays as-is.
- The "Key benefits" row below the cards stays as-is.
- The "Request a demo or consultation" CTA stays as-is.
- The grid remains `md:grid-cols-3` — three cards fit the existing responsive layout without
  changes.

## Out of scope

- No changes to the "Who We Are" nav label or any other section (Methods & Tools, Values,
  Contact).
- No icon changes — the three existing icons carry over unchanged.
- No changes to styling classes beyond adding the one new muted "Examples" line.
