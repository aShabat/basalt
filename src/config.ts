import { config } from "dotenv"

config()

export default {
  database_host: process.env.DATABASE_URL || "localhost",
  database_user: process.env.DATABASE_USER || "basalt",
  database_db: process.env.DATABASE_DB || "basalt",
  database_port: +(process.env.DATABASE_port || 5432),
  database_password: process.env.DATABASE_PASSWORD,

  jwt_key: process.env.JWT_KEY || "test_jwt_key",
}
