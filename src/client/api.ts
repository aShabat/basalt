import axios, { AxiosResponse } from "axios"
import { ZodType } from "zod"
import { Graph, Note, RootFolder, User } from "../schemas/types"
import {
  CreateFolder,
  CreateNote,
  LogIn,
  SignUp,
  UpdateNote,
} from "../schemas/api"

const axiosI = axios.create({ baseURL: "/api" })

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

function serverMessage(data: unknown) {
  if (typeof data === "string") return data
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error
  }
}

function toApiError(err: unknown) {
  if (err instanceof ApiError) return err
  if (axios.isAxiosError(err)) {
    return new ApiError(
      serverMessage(err.response?.data) || err.message,
      err.response?.status,
    )
  }
  return new ApiError(err instanceof Error ? err.message : "request failed")
}

async function request<T>(
  call: () => Promise<AxiosResponse>,
  schema: ZodType<T>,
) {
  try {
    const response = await call()
    return schema.parse(response.data)
  } catch (err) {
    throw toApiError(err)
  }
}

async function requestVoid(call: () => Promise<unknown>) {
  try {
    await call()
  } catch (err) {
    throw toApiError(err)
  }
}

interface userParams {
  name?: string
  id?: number
}
export async function getUser(params?: userParams) {
  if (params?.name) {
    return request(
      () => axiosI.get("/users", { params: { name: params.name } }),
      User,
    )
  }
  if (params?.id) {
    return request(() => axiosI.get(`/users/${params.id}`), User)
  }
  return request(() => axiosI.get("/users/me"), User)
}

export async function postUserLogin(name: string, password: string) {
  const requestBody = LogIn.parse({ name, password })
  return request(() => axiosI.post("/session", requestBody), User)
}

export async function postUserSignup(name: string, password: string) {
  const requestBody = SignUp.parse({ name, password })
  return request(() => axiosI.post("/users", requestBody), User)
}

export async function deleteLogout() {
  await requestVoid(() => axiosI.delete("/session"))
}

export async function getGraph(user_id: number) {
  return request(() => axiosI.get(`/users/${user_id}/graph`), Graph)
}

export async function getTree(user_id: number) {
  return request(() => axiosI.get(`/users/${user_id}/tree`), RootFolder)
}

export async function createFolder(
  user_id: number,
  parent_id: undefined | number,
  title: string,
  path: string,
) {
  const requestBody = CreateFolder.parse({ parent_id, title, path })
  await requestVoid(() => axiosI.post("/folders", requestBody))
  return await getTree(user_id)
}

export async function deleteFolder(user_id: number, id: number) {
  await requestVoid(() => axiosI.delete(`/folders/${id}`))
  return await getTree(user_id)
}

export async function getNote(id: number) {
  return request(() => axiosI.get(`/notes/${id}`), Note)
}

export async function createNote(
  user_id: number,
  folder_id: number | undefined,
  title: string,
  path: string,
) {
  const requestBody = CreateNote.parse({ folder_id, title, path, content: "" })
  await requestVoid(() => axiosI.post("/notes", requestBody))
  return await getTree(user_id)
}

export async function updateNote(
  id: number,
  folder_id: number | undefined,
  title: string | undefined,
  path: string | undefined,
  content: string | undefined,
) {
  const requestBody = UpdateNote.parse({ title, folder_id, content, path })
  return request(() => axiosI.patch(`/notes/${id}`, requestBody), Note)
}

export async function deleteNote(user_id: number, id: number) {
  await requestVoid(() => axiosI.delete(`/notes/${id}`))
  return await getTree(user_id)
}
