import config from "../config.ts"
import { Kysely, PostgresDialect, sql } from "kysely"
import { Pool } from "pg"

interface DB {}

const dialect = new PostgresDialect({
  pool: new Pool({
    database: config.database_db,
    host: config.database_host,
    user: config.database_user,
    port: config.database_port,
    password: config.database_password,
  }),
})
const db = new Kysely<DB>({ dialect })

await db.schema.dropTable("users").ifExists().cascade().execute()
await db.schema.dropTable("folders").ifExists().cascade().execute()
await db.schema.dropTable("notes").ifExists().cascade().execute()
await db.schema.dropTable("links").ifExists().cascade().execute()

await db.schema
  .createTable("users")
  .addColumn("id", "integer", (col) =>
    col.generatedAlwaysAsIdentity().primaryKey(),
  )
  .addColumn("name", "text", (col) => col.notNull().unique())
  .addColumn("encrypted_password", "text", (col) => col.notNull())
  .addColumn("date_added", "timestamp", (col) =>
    col.notNull().defaultTo(sql`current_timestamp`),
  )
  .execute()

await db.schema
  .createTable("folders")
  .addColumn("id", "integer", (col) =>
    col.generatedAlwaysAsIdentity().primaryKey(),
  )
  .addColumn("user_id", "integer", (col) =>
    col.notNull().references("users.id").onDelete("cascade"),
  )
  .addColumn("parent_id", "integer", (col) =>
    col.references("folders.id").onDelete("cascade"),
  )
  .addColumn("title", "text", (col) => col.notNull())
  .addColumn("path", "text", (col) => col.notNull())
  .addColumn("date_added", "timestamp", (col) =>
    col.notNull().defaultTo(sql`current_timestamp`),
  )
  .addColumn("date_updated", "timestamp", (col) =>
    col.notNull().defaultTo(sql`current_timestamp`),
  )
  .addUniqueConstraint(
    "unique_user_parent_title",
    ["user_id", "parent_id", "title"],
    (cb) => cb.nullsNotDistinct(),
  )
  .execute()

await db.schema
  .createTable("notes")
  .addColumn("id", "integer", (col) =>
    col.generatedAlwaysAsIdentity().primaryKey(),
  )
  .addColumn("user_id", "integer", (col) =>
    col.notNull().references("users.id").onDelete("cascade"),
  )
  .addColumn("folder_id", "integer", (col) =>
    col.references("folders.id").onDelete("cascade"),
  )
  .addColumn("title", "text", (col) => col.notNull())
  .addColumn("path", "text", (col) => col.notNull())
  .addColumn("content", "text", (col) => col.notNull())
  .addColumn("is_private", "boolean", (col) => col.notNull().defaultTo(false))
  .addColumn("date_added", "timestamp", (col) =>
    col.notNull().defaultTo(sql`current_timestamp`),
  )
  .addColumn("date_updated", "timestamp", (col) =>
    col.notNull().defaultTo(sql`current_timestamp`),
  )
  .addUniqueConstraint(
    "unique_user_folder_title",
    ["user_id", "folder_id", "title"],
    (cb) => cb.nullsNotDistinct(),
  )
  .execute()

await db.schema
  .createTable("links")
  .addColumn("id", "integer", (col) =>
    col.generatedAlwaysAsIdentity().primaryKey(),
  )
  .addColumn("user_id", "integer", (col) =>
    col.notNull().references("users.id").onDelete("cascade"),
  )
  .addColumn("from_id", "integer", (col) =>
    col.notNull().references("notes.id").onDelete("cascade"),
  )
  .addColumn("from_url", "text", (col) => col.notNull())
  .addColumn("to_url", "text", (col) => col.notNull())
  .execute()

if (process.argv.length > 2) {
  const { generateModels } = await import("./gen_models.ts")
  await generateModels(process.argv[2])
}
