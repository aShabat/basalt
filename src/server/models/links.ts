import { db } from "./db.ts"
import { NotesId, UsersId } from "./generated/index.ts"

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

export async function createLinks(
  user_id: number,
  from_id: number,
  from_url: string,
  to_urls: string[],
) {
  try {
    return await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("links")
        .where("user_id", "=", user_id as UsersId)
        .where("from_url", "=", from_url)
        .execute()

      if (!to_urls.length) return []

      return await trx
        .insertInto("links")
        .values(
          to_urls.map((to_url) => ({
            user_id: user_id as UsersId,
            from_id: from_id as NotesId,
            from_url: from_url,
            to_url: to_url,
          })),
        )
        .returningAll()
        .execute()
    })
  } catch (err) {
    console.log("error in createLinks")
    console.log(err)
  }
}
