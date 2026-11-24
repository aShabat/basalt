import config from "../config.ts"
import kanel from "kanel"
import kanel_kysely from "kanel-kysely"
import { pathToFileURL } from "node:url"

export async function generateModels(outputPath: string) {
  await kanel.processDatabase({
    connection: {
      host: config.database_host,
      user: config.database_user,
      database: config.database_db,
      port: config.database_port,
      password: config.database_password,
    },
    outputPath,
    preDeleteOutputFolder: true,
    tsModuleFormat: "esm",
    preRenderHooks: [kanel_kysely.makeKyselyHook(), kanel.generateIndexFile],
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateModels(process.argv[2] || "src/server/models/generated")
}
