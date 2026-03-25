import axios, { HttpStatusCode } from "axios"
import { User } from "../schemas/types"
import { LogIn } from "../schemas/api"

const axiosI = axios.create({ baseURL: "/api" })

export async function getUser() {
  const response = await axiosI.get("/user")
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
  const response = await axiosI.delete("/user/logout")
}
