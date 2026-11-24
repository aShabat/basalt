# AGENTS.md

Basalt is an Obsidian-light note app: folder tree, markdown notes, wiki-style
links, link graph. It is an unfinished prototype. Prefer shipping the next
feature over rewrites, new dependencies, or test/lint scaffolding. `todo` holds
the active action plan; work through it in order unless the user redirects.

## Product decisions

- Public read, private write: profiles, trees, notes, and graphs are public,
  including other users' content. Editing requires the owner.
- Cross-user references are allowed in links; cross-user edits are not.
- Notes get `is_private` (planned, not implemented yet). Private notes are hidden
  from non-owners; direct access returns `404`. Folders have no privacy flag.
- Logout clears the cookie and Redux state but keeps the current URL. A public
  note stays visible read-only; an owned private note redirects to the profile
  root.
- `src/server/routes/route_plan` is the target REST API. The running server still
  uses the older routes until the migration in `todo` lands.

## Commands

- `npm run dev` — single Express + Vite server on port 3000. nodemon restarts
  for `src/server` changes; Vite HMR handles client changes.
- `npm run build` — client-only build to `dist`.
- `npm start` — production: `tsx` server serving `dist`.
- `npm run init:db` — destructive: drops and recreates all tables, then
  regenerates Kysely types in `src/server/models/generated`.
- `npx tsc -p src/client --noEmit` — the working full-source typecheck.
  Do not use `npx tsc --noEmit`: the root tsconfig lacks JSX/client settings
  and reports ~130 bogus errors.
- Use npm with the committed `package-lock.json`; there is no devenv/Nix setup.
- No test, lint, format, or CI setup exists.

## Database

- Needs local Postgres. `.env` is untracked; `src/config.ts` reads
  `DATABASE_URL` as host plus `DATABASE_USER`, `DATABASE_DB`,
  `DATABASE_PASSWORD`, defaulting to localhost, user `basalt`, db `basalt`.
- Schema has no migrations: `src/extra/init_db.ts` is the canonical schema, but
  `npm run init:db` drops all data. For the existing DB, apply SQL directly and
  regenerate kanel output; a non-destructive `gen:models` script is planned in
  `todo`.
- `src/server/models/generated/` is gitignored kanel output. A fresh clone
  cannot typecheck or run server code until `npm run init:db` succeeds against
  a reachable database.
- `init_db.ts` passes raw `process.env` to kanel, including misspelled
  `DATABAS_URL`; dotenv is loaded through the `src/config.ts` import.

## Architecture

- Shared contract: `src/schemas/types.ts` (entities) and `src/schemas/api.ts`
  (request payloads). Client and server both validate with zod; change these
  first when an API shape changes.
- Server: `src/server/main.ts` mounts `/api/user`, `/api/note/:user_id`,
  `/api/folder/:user_id`. `auth.ts` decodes the HttpOnly `AuthToken` JWT into
  `req.user`; `req.path_user_id` comes from the URL. Routes live in
  `src/server/routes/`, Kysely queries per table in `src/server/models/`.
- Client: all HTTP calls in `src/client/api.ts`, pages in
  `src/client/components/`, auth slice in `src/client/store/`. The folder tree
  is rebuilt client-side from the flat `GET /api/user/tree` response.
- Navigation paths are built from user/folder/note titles, not DB `path`
  columns. `path` is a denormalized duplicate also used as link identity
  (markdown `(target)` links become `from_url`/`to_url`).

## API quirks

- Create is `PUT /api/{note,folder}/:user_id`, update is `POST .../:id`,
  delete is `DELETE .../:id` — not RESTful PUT/PATCH.
- Reads are public: `GET /api/user`, `/api/user/tree`, `/api/user/graph`
  accept `?name=` or `?id=` and fall back to the cookie user. `route_plan` is
  the target REST shape; these are the current pre-migration endpoints.
- Write routes only compare `req.user.id` with `:user_id`; model get/alter/
  delete queries do not filter by owner. Any logged-in user can edit another
  user's rows by passing their own `:user_id`. Add user filters when touching
  those queries.
- Errors are mostly `console.log` in models plus `undefined` returns; there is
  no global Express error middleware. Zod parse failures use default Express
  error responses.
- Server ESM imports mix explicit `.ts` and `.js`; client/shared imports are
  extensionless. Both resolve via tsx/Vite; match the file being edited rather
  than normalizing extensions repo-wide.
- SQL `null` `folder_id` is converted to `undefined` at route boundaries;
  keep client and server schemas aligned with that.
- `App.tsx` auth bootstrap effect has no dependency array, so it refetches on
  every render. Start there when fixing auth or render loops.
- Logout currently navigates to `/` and leaves the Redux user set. Target
  behavior is no navigation, clear auth, and stay on a public note.
