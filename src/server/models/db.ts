import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"
import Database from "./generated/Database.ts"
import config from "../../config.ts"

const dialect = new PostgresDialect({
  pool: new Pool({
    database: config.database_db,
    host: config.database_host,
    user: config.database_user,
    port: config.database_port,
    password: config.database_password,
  }),
})
export const db = new Kysely<Database>({ dialect })
