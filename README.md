# Basalt

Basalt is an Obsidian-light note app: folders, markdown notes, wiki-style
links, private notes, and an interactive link graph.

## Features

- Folder tree with nested notes
- Markdown editing with preview
- Internal links between notes using `[label](/path)` or bare `(/path)`
- Rename notes and folders with link preview and confirmation
- Private notes visible only to their owner
- Interactive graph with draggable nodes, pan, and zoom
- Public profiles and notes; editing is owner-only

## Stack

- React 19, Redux Toolkit, React Router
- Express 5, Kysely, PostgreSQL
- Zod contracts shared by client and server
- Vite, TypeScript, tsx

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
```

`DATABASE_URL` is used as the database host. Optional values fall back to the
defaults in `src/config.ts`.

## Commands

```bash
npm install
npm run dev
```

- `npm run dev` — Express + Vite on port `3000`; server restarts on
  `src/server`, `src/schemas`, and `src/config.ts` changes.
- `npm run build` — production client build into `dist`.
- `npm start` — production server serving `dist`.
- `npm run typecheck` — TypeScript check for the whole source tree.
- `npm run check` — typecheck plus production build.
- `npm run gen:models` — regenerate Kysely/Kanel types from the live database
  without dropping data.

Do not use `npx tsc --noEmit`; the root config does not include the client JSX
settings.

## Project layout

- `src/client/` — React UI, routing, Redux store, graph
- `src/server/` — Express routes, models, auth, graph/link helpers
- `src/schemas/` — shared Zod schemas and API contracts
- `src/extra/` — database/model generation utilities
- `src/server/routes/route_plan` — API outline

## Links

GitHub: https://github.com/aShabat/basalt_di_final
