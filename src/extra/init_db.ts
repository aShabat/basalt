import config from "../config.ts"
import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"
import kanel from "kanel"
import kanel_kysely from "kanel-kysely"

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
  .addColumn("content", "text", (col) => col.notNull())
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
  .addColumn("from_url", "text", (col) => col.notNull())
  .addColumn("to_url", "text", (col) => col.notNull())
  .execute()

if (process.argv.length > 2) {
  await kanel.processDatabase({
    connection: {
      host: process.env.DATABAS_URL,
      user: process.env.DATABASE_USER,
      database: process.env.DATABASE_DB,
      port: +(process.env.DATABASE_PORT || 5432),
    },
    outputPath: process.argv[2],
    preDeleteOutputFolder: true,
    tsModuleFormat: "esm",
    preRenderHooks: [kanel_kysely.makeKyselyHook(), kanel.generateIndexFile],
  })
}
