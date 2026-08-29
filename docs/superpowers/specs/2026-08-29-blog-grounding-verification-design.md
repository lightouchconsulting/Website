# Blog Generator: Grounding Verification Pass

## Problem

Draft articles produced by the weekly blog generator are frequently ungrounded: specific
claims, statistics, and quotes appear in the generated text that are not supported by the
source articles they're supposedly based on — sometimes outright fabricated. This was
confirmed by asking a separate LLM to review generated drafts.

Root cause: `synthesizePosts()` gives the writer only a ~300-character RSS snippet per
source, then asks for a ~600-word article. The model fills the gap with invented specifics.

## Scope

This change adds an automated fact-checking / revision pass after synthesis and before a
draft is committed to GitHub. It does not change the synthesis prompt, writing style, article
structure, or source material fetching — those are out of scope for this change and can be
tackled separately if still needed after this lands.

## Design

### Data flow

```
scrapeFeeds → classifyArticles → synthesizePosts → groundPost (new) → commit draft to GitHub
```

`synthesizePosts()` (in `synthesizer.ts`) already builds a `sourceContext` string per theme —
the concatenated Title/Source/Snippet blocks used to prompt the writer. This string is added
to the returned `DraftPost` so the verification step can reuse it as the grounding reference,
rather than reconstructing it.

```ts
export interface DraftPost {
  theme: string
  subThemes: string[]
  title: string
  content: string
  sources: { title: string; url: string; source: string }[]
  weekLabel: string
  sourceContext: string // NEW — reused by verifier.ts
}
```

### New module: `blog-generator/verifier.ts`

Three functions:

- **`checkGrounding(content: string, sourceContext: string): Promise<string[]>`**
  LLM call. Given the draft content and the source material, returns a JSON array of specific
  claims/stats/quotes in the draft that are not supported by the source material. An empty
  array means the draft is clean.

- **`reviseContent(content: string, sourceContext: string, issues: string[]): Promise<string>`**
  LLM call. Given the draft, the source material, and the flagged claims, rewrites *only* the
  flagged sentences — removing or generalizing them so they no longer assert unsupported
  facts — while leaving the rest of the article unchanged. Returns the full revised article
  text.

- **`groundPost(post: DraftPost): Promise<{ post: DraftPost; grounded: boolean; attempts: number }>`**
  Orchestrates the retry loop, in cycles of (check, then revise if needed):
  1. `checkGrounding` on current content.
  2. If clean, stop immediately and return `grounded: true`.
  3. If not, `reviseContent`, then start the next cycle back at step 1.
  4. Capped at 3 cycles total. If the 3rd cycle's check still finds issues, the resulting
     revision is *not* re-checked a 4th time — the loop simply ends with `grounded: false`.
     This bounds the cost at exactly 3 checks + 3 revises in the worst case (see Cost below).

### Unresolved after 3 attempts

If the draft still has flagged claims after 3 attempts, it is **not** discarded and **not**
silently published as-is. Instead, a plain warning line is prepended to the content, right
after the frontmatter:

```
⚠️ Grounding check flagged possible unsupported claims after 3 revision attempts — review before publishing.

# Article Title
...
```

This surfaces the issue wherever the draft is viewed/edited (including the admin panel, since
it renders the raw content) without requiring any new UI work. It's a single line to delete
once reviewed and confirmed fine, or the draft can be manually corrected/regenerated.

### Error handling

If a `checkGrounding` or `reviseContent` call fails (network error, malformed JSON response,
etc.):
- Log the failure.
- Stop retrying for that draft (don't spend further attempts).
- Apply the same "unresolved" warning treatment described above, since grounding could not be
  confirmed.
- Never throw out of `groundPost` — a single theme's grounding failure must not crash the
  weekly run for the other themes, consistent with how `classifier.ts` and `synthesizer.ts`
  already degrade per-item on failure rather than failing the whole batch.

### Integration point

In `index.ts`, after:
```ts
const posts = await synthesizePosts(classified, themesConfig.themes, weekLabel)
```
add:
```ts
const groundedPosts = await Promise.all(posts.map(p => groundPost(p)))
```
and use `groundedPosts[i].post` (with its possibly-revised, possibly-warning-prefixed content)
in place of the original `posts[i]` when building frontmatter and committing to GitHub.

### Cost

Up to 2 extra Groq calls per theme per week in the typical (clean-on-first-check) case, up to
6 in the worst case (3 full check/revise cycles). Negligible given Groq's pricing and speed,
and bounded by the retry cap.

## Testing

Unit tests for `verifier.ts`:
1. A clean draft (no flagged claims) passes through unchanged after a single check.
2. A draft with flagged claims gets revised, re-checked, and passes within the retry budget.
3. A draft that never clears after 3 attempts has the warning line prepended, and the loop
   stops at 3 attempts (not more).
4. A `checkGrounding` or `reviseContent` API failure is caught, logged, and results in the
   warning treatment rather than a thrown error.

## Out of scope (explicitly deferred)

- Fetching full source article text instead of RSS snippets (would reduce how often grounding
  issues occur in the first place — a root-cause fix, but a separate, larger change).
- Improving writing style / reducing repetitive structure (confirmed not a current priority).
- Any admin panel UI changes to surface grounding status structurally (e.g. a dedicated
  frontmatter flag/badge) — the inline warning line is sufficient for now.
