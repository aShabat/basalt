import { db } from "./db.ts"
import { NotesId, UsersId } from "./generated/index.ts"

export async function getUserLinks(user_id: number) {
  try {
    return await db
      .selectFrom("links")
      .where("from_id", "in", (eb) =>
        eb
          .selectFrom("notes")
          .select("notes.id")
          .where("user_id", "=", user_id as UsersId),
      )
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
  to_ids: number[],
) {
  try {
    await db
      .deleteFrom("links")
      .where("from_id", "=", from_id as NotesId)
      .execute()
    return await db
      .insertInto("links")
      .values(
        to_ids.map((to_id) => ({
          user_id: user_id as UsersId,
          from_id: from_id as NotesId,
          to_id: to_id as NotesId,
        })),
      )
      .returningAll()
      .execute()
  } catch (err) {
    console.log("error in createLinks")
    console.log(err)
  }
}
