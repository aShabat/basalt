import axios, { HttpStatusCode } from "axios"
import { RootFolder, User } from "../schemas/types"
import { CreateFolder, LogIn } from "../schemas/api"

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
  try {
    return RootFolder.parse(response.data)
  } catch (err) {
    console.log(err)
  }
}
