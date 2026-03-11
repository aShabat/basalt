import { User } from "../../schemas/types.ts"
import { db } from "./db.ts"
import { UsersId } from "./generated/index.ts"

export async function getUser(id: number) {
  try {
    const result = await db
      .selectFrom("users")
      .where("id", "=", id as UsersId)
      .selectAll()
      .execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    const { encrypted_password } = result[0]
    return { user: result[0], encrypted_password }
  } catch (err) {
    console.log("error in getUser")
    console.log(err)
  }
}

export async function getUserByName(name: string) {
  try {
    const result = await db
      .selectFrom("users")
      .where("name", "=", name)
      .selectAll()
      .execute()
    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in getUserByName")
    console.log(err)
  }
}

export async function createUser(name: string, encrypted_password: string) {
  try {
    const result = await db
      .insertInto("users")
      .values({
        name: name,
        encrypted_password: encrypted_password,
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

export async function deleteUser(id: number) {
  try {
    await db
      .deleteFrom("users")
      .where("id", "=", id as UsersId)
      .execute()
    return id
  } catch (err) {
    console.log("error in deleteUser")
    console.log(err)
  }
}

export async function alterUser(id: number, encrypted_password: string) {
  try {
    let result = await db
      .updateTable("users")
      .set("encrypted_password", encrypted_password)
      .where("id", "=", id as UsersId)
      .returningAll()
      .execute()

    if (result.length !== 1)
      throw new Error(`expected 1 value, got ${result.length}`)
    return result[0]
  } catch (err) {
    console.log("error in alterUser")
    console.log(err)
  }
}
