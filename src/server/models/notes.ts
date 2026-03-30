import { sql } from "kysely"
import { db } from "./db.ts"
import { FoldersId, NotesId, UsersId } from "./generated/index.ts"

export async function getUserNotes(user_id: number) {
  try {
    const result = await db
      .selectFrom("notes")
      .where("user_id", "=", user_id as UsersId)
      .selectAll()
      .execute()
    return result
  } catch (err) {
    console.log("error in getUserNotes")
    console.log(err)
  }
}

export async function getNote(id: number) {
  try {
    const result = await db
      .selectFrom("notes")
      .where("id", "=", id as NotesId)
      .selectAll()
      .execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in getNote")
    console.log(err)
  }
}

export async function createNote(
  user_id: number,
  folder_id: number | undefined,
  title: string,
  path: string,
  content: string,
) {
  try {
    const result = await db
      .insertInto("notes")
      .values({
        user_id: user_id as UsersId,
        folder_id: (folder_id || null) as FoldersId,
        title,
        content,
        path,
      })
      .returningAll()
      .execute()

    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in createNote")
    console.log(err)
  }
}

export async function deleteNote(id: number) {
  try {
    await db
      .deleteFrom("notes")
      .where("id", "=", id as NotesId)
      .execute()
    return id
  } catch (err) {
    console.log("error in deleteNote")
    console.log(err)
  }
}

export async function alterNote(
  id: number,
  folder_id: number | undefined,
  title: string | undefined,
  content: string | undefined,
  path: string | undefined,
) {
  try {
    let query = db
      .updateTable("notes")
      .set({
        folder_id: folder_id ? (folder_id as FoldersId) : undefined,
        title,
        content,
        path,
        date_updated: sql`default`,
      })
      .where("id", "=", id as NotesId)
      .returningAll()

    console.log(query.compile().parameters)

    const result = await query.execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in alterNote")
    console.log(err)
  }
}
