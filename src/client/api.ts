import axios, { HttpStatusCode } from "axios"
import { Note, RootFolder, User } from "../schemas/types"
import { CreateFolder, CreateNote, LogIn, UpdateNote } from "../schemas/api"

const axiosI = axios.create({ baseURL: "/api" })

interface userParams {
  name?: string
  id?: number
}
export async function getUser(params?: userParams) {
  const response = await axiosI.get("/user", { params })
  if (response.status !== HttpStatusCode.Ok) return
  try {
    return User.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function postUserLogin(name: string, password: string) {
  const requestBody = LogIn.parse({ name, password })
  const response = await axiosI.post("/user/login", requestBody)
  if (response.status !== HttpStatusCode.Ok) {
    return
  }
  try {
    return User.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function postUserSignup(name: string, password: string) {
  const requestBody = LogIn.parse({ name, password })
  const response = await axiosI.post("/user/signup", requestBody)
  if (response.status !== HttpStatusCode.Ok) {
    return
  }
  try {
    return User.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function deleteLogout() {
  await axiosI.delete("/user/logout")
}

export async function getTree(params?: userParams) {
  const response = await axiosI.get("/user/tree", { params })
  if (response.status !== HttpStatusCode.Ok) {
    return
  }
  try {
    return RootFolder.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function createFolder(
  user_id: number,
  parent_id: undefined | number,
  title: string,
) {
  const requestBody = CreateFolder.parse({ parent_id, title })
  const response = await axiosI.put(`/folder/${user_id}`, requestBody)

  if (response.status !== HttpStatusCode.Ok) {
    return
  }
  return await getTree({ id: user_id })
}

export async function deleteFolder(user_id: number, id: number) {
  const response = await axiosI.delete(`/folder/${user_id}/${id}`)
  if (response.status !== HttpStatusCode.Ok) return
  return await getTree({ id: user_id })
}

export async function getNote(user_id: number, id: number) {
  const response = await axiosI.get(`/note/${user_id}/${id}`)
  if (response.status !== HttpStatusCode.Ok) return
  try {
    return Note.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function createNote(
  user_id: number,
  folder_id: number | undefined,
  title: string,
) {
  const requestBody = CreateNote.parse({ folder_id, title, content: "" })
  const response = await axiosI.put(`/note/${user_id}`, requestBody)
  if (response.status !== HttpStatusCode.Ok) {
    return
  }
  return await getTree({ id: user_id })
}

export async function updateNote(
  user_id: number,
  id: number,
  folder_id: number | undefined,
  title: string | undefined,
  content: string | undefined,
) {
  const requestBody = UpdateNote.parse({ title, folder_id, content })
  const response = await axiosI.post(`/note/${user_id}/${id}`, requestBody)
  if (response.status !== HttpStatusCode.Ok) return
  try {
    return Note.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}

export async function deleteNote(user_id: number, id: number) {
  const response = await axiosI.delete(`/note/${user_id}/${id}`)
  if (response.status !== HttpStatusCode.Ok) return
  return await getTree({ id: user_id })
}
