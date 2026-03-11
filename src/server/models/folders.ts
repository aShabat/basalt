import { db } from "./db.ts"
import { FoldersId, NotesId, UsersId } from "./generated/index.ts"

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

export async function getFolders(id: number) {
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
) {
  try {
    const result = await db
      .insertInto("folders")
      .values({
        user_id: user_id as UsersId,
        parent_id: (parent_id || null) as FoldersId,
        title: title,
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
) {
  try {
    let query = db
      .updateTable("folders")
      .where("id", "=", id as FoldersId)
      .returningAll()
    query = parent_id ? query.set("parent_id", parent_id as FoldersId) : query
    query = title ? query.set("title", title) : query

    const result = await query.execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in alterNote")
    console.log(err)
  }
}
