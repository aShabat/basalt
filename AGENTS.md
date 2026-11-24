# AGENTS.md

Basalt is an Obsidian-light note app: folder tree, markdown notes, wiki-style
links, link graph. It is an unfinished prototype. Prefer shipping the next
feature over rewrites, new dependencies, or test/lint scaffolding. `todo` holds
the active action plan; work through it in order unless the user redirects.

## Product decisions

- Public read, private write: profiles, trees, notes, and graphs are public,
  including other users' content. Editing requires the owner.
- Cross-user references are allowed in links; cross-user edits are not.
- Notes have `is_private` (added, filtering not implemented yet). Private notes
  will be hidden from non-owners; direct access will return `404`. Folders have no
  privacy flag.
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
- Write routes verify both the URL `:user_id` and the fetched row's `user_id`;
  keep new writes scoped by owner.
- Errors: Zod failures return `400` JSON and unexpected errors return `500`
  JSON from `main.ts`. Models still log and may return `undefined`.
- Client API helpers throw `ApiError` with the server message; callers handle it
  instead of relying on `undefined`.
- Server ESM imports mix explicit `.ts` and `.js`; client/shared imports are
  extensionless. Both resolve via tsx/Vite; match the file being edited rather
  than normalizing extensions repo-wide.
- SQL `null` `folder_id` is converted to `undefined` at route boundaries;
  keep client and server schemas aligned with that.
- Logout dispatches `logout()` without navigating; editing UI derives from
  `isEditable`, so logged-out visitors stay on public notes read-only.
