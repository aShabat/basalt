# Basalt

Basalt is an Obsidian-light note app: folders, markdown notes, wiki-style
links, private notes, public profiles, and an interactive link graph.

## Features

- Collapsible folder tree with nested notes
- Markdown editor with side-by-side live preview
- Path-based note URLs; right-click a note row to copy its link
- Internal links using `[label](/path)` or bare `(/path)`
- Spaces in link paths supported
- Rename notes and folders with link preview and confirmation
- Private notes visible only to their owner
- Interactive graph with draggable nodes, pan, zoom, and reset
- Public profiles and notes; editing is owner-only
- New users receive a public `Welcome` starter note

## Stack

- React 19, Redux Toolkit, React Router
- Express 5, Kysely, PostgreSQL
- Zod contracts shared by client and server
- Vite, TypeScript, tsx
- Akar Icon font and Special Elite display font

## Requirements

- Node.js and npm
- An existing PostgreSQL database configured through environment variables

## Environment

Create an untracked `.env` in the project root:

```dotenv
JWT_KEY=change_me
DATABASE_URL=localhost
DATABASE_USER=basalt
DATABASE_DB=basalt
DATABASE_PORT=5432
DATABASE_PASSWORD=
BCRYPT_SALT_ROUNDS=13
PORT=3000
```

- `DATABASE_URL` is used as the database host.
- `DATABASE_PORT` defaults to `5432`.
- `PORT` controls the Express port and defaults to `3000`.
- Other optional values fall back to defaults in `src/config.ts`.

## Commands

```bash
npm install
npm run dev
```

- `npm run dev` — Express + Vite on `PORT`; server restarts on `src/server`,
  `src/schemas`, and `src/config.ts` changes.
- `npm run build` — production client build into `dist`.
- `npm start` — production server serving `dist`; does not load Vite.
- `npm run typecheck` — TypeScript check for the whole source tree.
- `npm run check` — typecheck plus production build.
- `npm run gen:models` — regenerate Kysely/Kanel types from the live database
  without dropping data. Requires development dependencies.

Do not use `npx tsc --noEmit`; the root config does not include the client JSX
settings.

## Notes and links

- URLs are canonical note paths, such as `/test/a/n`.
- Renaming a note or folder updates its path and URL.
- If a rename affects markdown links, Basalt shows the affected notes before
  applying the mass edit.
- Supported internal link forms:

```md
[Other note](/test/Other note)
(/test/Other note)
[Other note](/test/Other note#section)
[Other note](</test/Other note>)
```

- External links are ignored by the graph.
- Private notes are omitted from other users' trees, direct reads, and graphs.
- Graph nodes can be dragged; drag the background to pan and scroll to zoom.

## Production

Build with development dependencies, then remove them:

```bash
npm ci
npm run build
npm prune --omit=dev
npm start
```

The production server serves `dist` with Express and does not load Vite or
`vite-express`. `vite`, `vite-express`, `typescript`, kanel, and nodemon are
development-only; `tsx` remains a runtime dependency.

Generated Kysely models are committed, so production does not need kanel or
`npm run gen:models`.

If you build outside the server, upload `dist/`, `src/`, `package.json`,
`package-lock.json`, and the committed generated models, then run
`npm ci --omit=dev` before starting.

## Project layout

- `src/client/` — React UI, routing, Redux store, graph
- `src/server/` — Express routes, models, auth, graph/link helpers
- `src/schemas/` — shared Zod schemas and API contracts
- `src/markdown.ts` — shared link parsing and markdown-link rewriting
- `src/extra/` — database/model generation utilities
- `src/server/routes/route_plan` — API outline

## External assets

- Akar Icon font: `https://unpkg.com/akar-icons-fonts`
- Special Elite: Google Fonts

Both are loaded in `index.html`; no icon package is installed locally. First
load requires network access to those CDNs.

## Links

GitHub: https://github.com/aShabat/basalt_di_final
