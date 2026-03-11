import { sql } from "kysely"
import { db } from "./db.ts"
import { UsersId } from "./generated/index.ts"

export async function getUserLinks(user_id: number) {
  try {
    return await db
      .selectFrom("links")
      .where("user_id", "=", user_id as UsersId)
      .selectAll()
      .execute()
  } catch (err) {
    console.log("error in getUserLinks")
    console.log(err)
  }
}

export async function deleteLinks(from_url: string) {
  await db.deleteFrom("links").where("from_url", "=", from_url).execute()
}

export async function createLinks(
  user_id: UsersId,
  from_url: string,
  to_urls: string[],
) {
  try {
    await deleteLinks(from_url)
    return await db
      .insertInto("links")
      .values(
        to_urls.map((to_url) => ({
          user_id: user_id as UsersId,
          from_url: from_url,
          to_url: to_url,
        })),
      )
      .returningAll()
      .execute()
  } catch (err) {
    console.log("error in createLinks")
    console.log(err)
  }
}
