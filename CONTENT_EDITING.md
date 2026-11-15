# Content editing

## Start locally
Use Node 22.18 or a compatible supported version. Run `npm ci`, then `npm run dev -- --hostname 127.0.0.1 --port 3001`. The site is at http://127.0.0.1:3001. `npm run build` and `npm start` provide a production-mode local preview at port 3000.

## Central configuration
Edit `src/data/site.ts` for name, social links, résumé location, milestone copy, and the toolkit. Leave unknown URLs empty; they are omitted. Use a real `https://` canonical origin in `NEXT_PUBLIC_SITE_URL` when a domain is approved. Place approved résumé PDFs under `public/media/` and set the matching path. Never place private documents there.

## Articles, projects, and notes
Collections live under `src/content/`. Frontmatter is validated at build time. Slugs must be lowercase words separated by hyphens and unique within their collection.

Articles require `slug`, `title`, `description`, `tags`, and `draft`. Set `publishedAt: "YYYY-MM-DD"` only upon publication approval, and `draft: false` to publish. Optional: `updatedAt`, `featured`. The default is draft. Local preview: `/preview/writing/designing-the-handoff` in development only. Production returns 404 even on localhost. Drafts never enter public search, routes, RSS, or sitemap.

Projects require `role`, `status`, `technologies`, and `visibility` in addition to common fields. Only public, non-draft entries appear. Notes require a quoted `date`; new notes appear on `/now` after `draft: false`. Describe a dated snapshot rather than imply live status.

MDX supports standard Markdown/GFM, code highlighting, `<Callout title="…">`, `<PipelineDemo />`, and `<LatencyDemo />`. Only trusted repository MDX is compiled; JavaScript expressions are blocked. Never compile public uploads as MDX. Headings provide TOC anchors. Cross-link relevant projects and experiments with local URLs. Use unique level-two headings so anchors remain unambiguous.

## Activity import
There is no public upload/API administration route. Put raw input in `.private/` (gitignored), outside `public/`. Review provenance, provider labels, and intended public daily totals before importing.

JSON format:
```json
{
  "version": 1,
  "timezone": "America/Detroit",
  "coverage": { "start": "2026-11-01", "end": "2026-11-02", "complete": false },
  "records": [
    { "date": "2026-11-01", "provider": "Provider name", "inputTokens": 0, "outputTokens": 0, "totalTokens": 0 }
  ]
}
```
These zeroes document the shape, not actual usage. Use real source-reported numbers. Do not estimate consumer ChatGPT/Codex activity.

CSV headers: `date,provider,inputTokens,outputTokens,totalTokens`. Supply JSON metadata with version/timezone/coverage via `--metadata .private/coverage.json`. Quoted fields, escaped quotes, BOM and CRLF are supported.

Validate first:
```
npm run activity:import -- --input .private/usage.json --reviewed --dry-run
```
Import after reviewing the aggregates:
```
npm run activity:import -- --input .private/usage.json --reviewed
```
The import atomically replaces `src/data/activity.json`. Reimporting never adds a second copy. One date/provider is one aggregate; duplicates (including case variants) are errors. Input and output must sum to total. Records outside declared coverage, future dates, negative/fractional/unsafe numbers, oversized files, and invalid timezones are rejected. `complete: true` asserts that absent dates are confirmed zero; use it only with evidence. Otherwise absent dates stay missing.

The public result contains only daily totals/provider labels, coverage, timezone, owner-review flag, and import timestamp. No raw breakdowns or cost/project/org fields are retained. Commit only the reviewed aggregate artifact if you want builds to publish it. Remove that artifact to disconnect the source. Integration identifiers are reserved; live OpenAI, GitHub, and application-event adapters are deferred.

Local visual fixture: `/preview/activity`. It says DEMO DATA and is development-only. Its values are not real usage.

## Public launch
`src/data/release.json` is an approval record, not a shortcut. Keep entries false until approval exists. `npm run release:check` lists missing gates. Public builds (`PUBLIC_RELEASE=1` or Vercel's production environment) fail unless gates pass, the writing empty state or published articles are approved, a personal contact method exists, and a real HTTPS origin is configured. Local/preview builds remain non-indexable via metadata, HTTP header, and robots.txt. Public builds lift those controls only after checks pass.

Hosting uses Cloudflare Pages. Run `npm run build:static` and deploy `out/`. No Next.js runtime adapter is required. The owner authorized launch and domain setup on November 15, 2026.

## Checks
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e`. E2E tests start a production server on 3000. For preview tests, also start the development server on 3001. Playwright Chromium is installed with `npx playwright install chromium`. Screenshots and reports are retained under `verification/` and the normal Playwright report folders.

Credits live in src/data/credits.ts. Add approved acknowledgment groups and source links there without changing page components.
