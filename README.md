# Vishvendra Reddy Bhoomidi

Personal portfolio at https://vishvendrabhoomidi.com — applied AI, product engineering, selected work, and interactive experiments.

Built with Next.js, React, TypeScript, MDX, and original Canvas/SVG graphics. Content is pre-rendered; interactions run in the browser. No production database, provider keys, or application server are required.

## Development

Requires Node 22.23+ and npm.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run lint
npm test
npm run build:static
```

Cloudflare Pages builds from `main` with `npm run lint && npm test && npm run build:static` and publishes `out/`. No deploy API token is stored in GitHub. `scripts/export-site.ts` emits security headers with hashes for Next.js inline scripts. Serve unknown paths as genuine 404 responses, not an SPA fallback. Fingerprinted assets use immutable caching.

The canonical origin is https://vishvendrabhoomidi.com. Production enables indexing; ordinary local builds remain noindex. Social previews use the owner-supplied image. Optional public ownership verification tags are documented in `.env.example`.

## Content

Projects and writing live under `src/content/`; shared profile information lives in `src/data/site.ts`. See `CONTENT_EDITING.md` and `THIRD_PARTY_NOTICES.md`.

Writing currently has an intentional empty state. Draft essays remain unpublished. Activity is disconnected until a reviewed, privacy-safe import is available. No private application documents, raw conversation exports, credentials, or QA recordings belong in this repository.

The owner authorized publication and domain setup on November 15, 2026. The release manifest records that launch decision without publishing draft writing.
