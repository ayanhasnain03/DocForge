# Harc Docs

Production documentation CMS built with **Next.js App Router**, **Fumadocs**, **MDX**, and **TinaCMS**.

Public URLs are root-level — there is **no** `/docs` prefix:

| URL | Content |
| --- | --- |
| `/` | Portal (`content/docs/index.mdx`) |
| `/ai` | AI category |
| `/ai/models/gpt` | Nested page |
| `/legal/privacy` | Nested page |
| `/admin` | TinaCMS admin |

## Architecture

```text
Next.js
   ├── Fumadocs  → layout, sidebar, search, TOC, MDX
   └── TinaCMS   → edit MDX + meta.json in Git
            │
     content/docs/   (source of truth)
```

Routing uses a single root catch-all:

```text
src/app/[[...slug]]/page.tsx
```

Navigation is generated from the filesystem + each folder's `meta.json`. Do not hardcode the sidebar.

## Quick start

```bash
pnpm install
pnpm dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Content layout

```text
content/docs/
├── meta.json
├── index.mdx
├── ai/
│   ├── meta.json
│   ├── index.mdx
│   ├── getting-started.mdx
│   ├── models/
│   │   ├── meta.json
│   │   ├── index.mdx
│   │   ├── gpt.mdx
│   │   └── claude.mdx
│   └── api/
│       ├── meta.json
│       ├── index.mdx
│       └── authentication.mdx
├── documentation/
├── legal/
└── license/
```

- Folder → category (collapsible in the sidebar)
- `index.mdx` → category landing page (`/ai`, `/ai/models`, …)
- Other `.mdx` → child pages
- Nested folder → child category
- `meta.json` → title, order, collapsible flags

### Example `meta.json`

```json
{
  "title": "Models",
  "pages": ["gpt", "claude"],
  "collapsible": true,
  "defaultOpen": true
}
```

**Do not list `"index"` in `pages`.** Keep `index.mdx` in the folder so the category itself is the page (`/legal`, `/ai/models`, …) and is clickable in the sidebar. Listing `"index"` would add a duplicate child and remove the folder link.

## TinaCMS workflow

1. Open `/admin`
2. **Documentation** collection — create/edit/delete MDX pages
3. **Navigation (meta.json)** — reorder pages, set category titles

### Nested pages

When creating a page under Models, set the filename path to:

```text
ai/models/new-page
```

That writes `content/docs/ai/models/new-page.mdx` and serves `/ai/models/new-page`.

Then add `"new-page"` to `content/docs/ai/models/meta.json` → `pages` (or keep `"..."` so new files appear automatically).

### New category

1. Create folder `content/docs/<section>/`
2. Add `index.mdx` + `meta.json`
3. Optionally nest more folders
4. List the folder name in the parent `meta.json` `pages` array

### Images

Upload via Tina media → files land in `public/uploads/` and are referenced from MDX.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Tina + Next.js local editing |
| `pnpm build` | Production build (Tina + Next) |
| `pnpm build:local` | Local Tina build without TinaCloud checks |
| `pnpm start` | Serve production build |

## Production / Git workflow

1. Editors change content in Tina (or PRs with MDX)
2. Changes commit to the content branch (TinaCloud or local Git)
3. Deploy rebuilds from `content/docs`
4. No database is required for the documentation hierarchy

Copy `.env.example` → `.env.local` and set TinaCloud values for hosted editing:

```bash
NEXT_PUBLIC_TINA_CLIENT_ID=
TINA_TOKEN=
```

## Key files

| File | Role |
| --- | --- |
| `src/lib/source.ts` | Fumadocs loader, `baseUrl: '/'` |
| `src/lib/shared.ts` | Route constants (no public `/docs`) |
| `src/app/[[...slug]]/` | Root catch-all docs pages |
| `src/app/api/search/route.ts` | Search |
| `tina/config.ts` | Tina collections + URL router |
| `content/docs/**` | MDX + meta.json source of truth |
| `proxy.ts` | Markdown negotiation (skips `/admin`, `/api`, …) |
