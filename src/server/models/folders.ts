import { sql } from "kysely"
import { db } from "./db.ts"
import { FoldersId, UsersId } from "./generated/index.ts"

export async function getUserFolders(user_id: number) {
  try {
    const result = await db
      .selectFrom("folders")
      .where("user_id", "=", user_id as UsersId)
      .selectAll()
      .execute()
    return result
  } catch (err) {
    console.log("error in getUserFolders")
    console.log(err)
  }
}

export async function getFolder(id: number) {
  try {
    const result = await db
      .selectFrom("folders")
      .where("id", "=", id as FoldersId)
      .selectAll()
      .execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in getFolders")
    console.log(err)
  }
}

export async function createFolder(
  user_id: number,
  parent_id: number | undefined,
  title: string,
  path: string,
) {
  try {
    const result = await db
      .insertInto("folders")
      .values({
        user_id: user_id as UsersId,
        parent_id: (parent_id || null) as FoldersId,
        title,
        path,
      })
      .returningAll()
      .execute()

    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in createFolder")
    console.log(err)
  }
}

export async function deleteFolder(id: number) {
  try {
    await db
      .deleteFrom("folders")
      .where("id", "=", id as FoldersId)
      .execute()
    return id
  } catch (err) {
    console.log("error in deleteFolder")
    console.log(err)
  }
}

export async function alterFolder(
  id: number,
  parent_id: number | undefined,
  title: string | undefined,
  path: string | undefined,
) {
  try {
    let query = db
      .updateTable("folders")
      .set({
        parent_id: parent_id as FoldersId,
        title,
        path,
        date_updated: sql`default`,
      })
      .where("id", "=", id as FoldersId)
      .returningAll()

    const result = await query.execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in alterNote")
    console.log(err)
  }
}
