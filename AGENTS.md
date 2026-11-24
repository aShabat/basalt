# AGENTS.md

Basalt is an Obsidian-light note app: folder tree, markdown notes, wiki-style
links, link graph. It is an unfinished prototype. Prefer shipping the next
feature over rewrites, new dependencies, or test/lint scaffolding. `todo` holds
the active action plan; work through it in order unless the user redirects.

## Product decisions

- Public read, private write: profiles, trees, notes, and graphs are public,
  including other users' content. Editing requires the owner.
- Cross-user references are allowed. Cross-user edits are not, except the
  confirmed rename flow, which may rewrite link targets inside other users'
  notes after the preview modal.
- Notes have `is_private`. Non-owners do not see private notes in trees or
  graphs; direct private note reads return `404`. Folders have no privacy flag.
- Logout clears the cookie and Redux state but keeps the current URL. A public
  note stays visible read-only; an owned private note redirects to the profile
  root.
- URLs are canonical note/folder paths (`/test/a/n`). `path` is mutable and
  updated on rename; the URL is updated to the new path.
- Titles and usernames are trimmed and reject `/`, `\`, `#`, `?`, control
  characters, and exactly `.`/`..`. Spaces and Unicode are allowed; URL segments
  are percent-encoded.
- Renames preview affected markdown links and require confirmation before
  editing link targets in note content. This can include other users' notes.
- Signup creates a public `Welcome` note at `/<username>/Welcome`; existing users
  are not backfilled.
- The navbar links to https://github.com/aShabat/basalt_di_final.
- `src/server/routes/route_plan` is the current REST API. The old
  `/api/user|note|folder` paths are removed.

## Commands

- `npm run dev` — single Express + Vite server on port 3000. nodemon restarts
  for `src/server` changes; Vite HMR handles client changes.
- `npm run build` — client-only build to `dist`.
- `npm start` — production: `tsx` server serving `dist`.
- `npm run init:db` — destructive: drops and recreates all tables, then
  regenerates Kysely types in `src/server/models/generated`.
- `npm run gen:models` — regenerates Kysely types from the live DB without
  dropping tables.
- `npm run check` — typecheck plus production client build. `npm run typecheck`
  runs the typecheck alone.
- Do not use `npx tsc --noEmit`: the root tsconfig lacks JSX/client settings
  and reports ~130 bogus errors.
- Use npm with the committed `package-lock.json`; there is no devenv/Nix setup.
- No test, lint, format, or CI setup exists.

## Database

- Needs local Postgres. `.env` is untracked; `src/config.ts` reads
  `DATABASE_URL` as host plus `DATABASE_USER`, `DATABASE_DB`,
  `DATABASE_PASSWORD`, defaulting to localhost, user `basalt`, db `basalt`.
  `README.md` intentionally documents only an existing DB, not database
  creation.
- Schema has no migrations: `src/extra/init_db.ts` is the canonical schema, but
  `npm run init:db` drops all data. For the existing DB, apply SQL directly and
  run `npm run gen:models`.
- `src/server/models/generated/` is gitignored kanel output. A fresh clone
  cannot typecheck or run server code until `npm run init:db` succeeds against
  a reachable database.
- `init_db.ts` reuses `generateModels` from `gen_models.ts`; both load dotenv
  through `src/config.ts`.

## Architecture

- Shared contract: `src/schemas/types.ts` (entities) and `src/schemas/api.ts`
  (request payloads). Client and server both validate with zod; change these
  first when an API shape changes.
- Server: `src/server/main.ts` mounts `/api/session`, `/api/users`,
  `/api/notes`, `/api/folders`. `auth.ts` decodes the HttpOnly `AuthToken` JWT
  into `req.user`; writes take ownership from that user, never from the URL.
  Routes live in `src/server/routes/`, Kysely queries per table in
  `src/server/models/`.
- Client: all HTTP calls in `src/client/api.ts`, pages in
  `src/client/components/`, auth slice in `src/client/store/`. The folder tree
  is rebuilt client-side from `GET /api/users/:user_id/tree`. `App.tsx` waits
  for the auth bootstrap before rendering routes.
- Navigation uses DB `path` values, not titles or IDs. The tree resolves a
  decoded URL path to a note/folder and navigates with encoded `path` values.
  Renames update paths, links, and affected markdown link targets.
- Link extraction uses `marked` tokens. External links and images are ignored;
  `[label](/path)` is the supported internal link form.
- `GraphView` runs the physics continuously. Nodes are draggable, background
  drag pans, wheel zooms, and reset re-seeds the layout. Physics lives in
  `Graph.tsx`.
- UI icons use the Akar icon font: `index.html` loads
  `https://unpkg.com/akar-icons-fonts`, and components use
  `<i className="ai-*">`. No icon package is installed locally.
- Note title, editor, and rendered markdown use `Special Elite` from Google
  Fonts, loaded in `index.html`.

## API quirks

- Creates use `POST /api/{notes,folders}` and compute `path` on the server.
  `PATCH /notes/:id` updates content/privacy only. Path-changing title edits use
  `POST /api/{notes,folders}/:id/rename` after `/rename/preview`. `PUT` routes
  were removed.
- Public reads: `GET /api/users?name=`, `/api/users/:user_id`,
  `/api/users/:user_id/tree`, `/api/users/:user_id/graph`,
  `/api/notes/:note_id`, `/api/folders/:folder_id`. `GET /api/users/me`
  requires auth. Private notes are omitted from non-owner trees/graphs and
  return `404` from direct note reads.
- `GET /users/:user_id/graph` returns `{ nodes, edges }`. Nodes include every
  visible note plus unresolved link targets; non-owner private targets stay
  unresolved. Duplicate links collapse to one edge and self-links are skipped.
- Unmatched `/api/*` paths return `404` JSON.
- Write routes verify the fetched row's `user_id` and filter mutations by owner
  in Kysely.
- Errors: Zod failures return `400` JSON, duplicate names/titles return `409`,
  and unexpected errors return `500` JSON from `main.ts`. Models still log and
  may return `undefined`.
- Client API helpers throw `ApiError` with the server message; callers handle it
  instead of relying on `undefined`.
- Server ESM imports mix explicit `.ts` and `.js`; client/shared imports are
  extensionless. Both resolve via tsx/Vite; match the file being edited rather
  than normalizing extensions repo-wide.
- SQL `null` `folder_id` is converted to `undefined` at route boundaries;
  keep client and server schemas aligned with that.
- Logout dispatches `logout()` without navigating; editing UI derives from
  `isEditable`, so logged-out visitors stay on public notes read-only.
