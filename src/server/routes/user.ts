import { Request, Router } from "express"
import { createUser, getUser, getUserByName } from "../models/users.js"
import { sign } from "../auth.js"
import bcrypt from "bcrypt"
import { LogIn, SignUp } from "../../schemas/api.ts"
import { HttpStatusCode } from "axios"
import config from "../../config.ts"
import { getUserFolders } from "../models/folders.ts"
import { getUserNotes } from "../models/notes.ts"
import { genFolder, genGraph } from "./helpers.ts"
import { Graph, RootFolder, User } from "../../schemas/types.ts"
import { getUserLinks } from "../models/links.ts"

const router = Router()

async function userFromQuery(req: Request) {
  const { name, id } = req.query
  if (name && id) {
    return "query can't contain both name and id"
  }

  if (name) {
    const user = await getUserByName(name as string)
    if (user) return user
    else return `couldn't find user with name ${name}`
  }

  if (id) {
    const user = await getUser(+id)
    if (user) return user
    else return `couldn't find user with id ${id}`
  }

  if (req.user) return req.user
  return "couldn't find the user"
}

router.get("/", async (req, res) => {
  const user = await userFromQuery(req)
  if (typeof user === "string") {
    res.status(HttpStatusCode.BadRequest).send(user)
  } else {
    res.json(User.parse(user))
  }
})

router.get("/tree", async (req, res) => {
  const user = await userFromQuery(req)
  if (typeof user === "string") {
    res.status(HttpStatusCode.BadRequest).send(user)
    return
  }
  const folders = await getUserFolders(user.id)
  const notes = await getUserNotes(user.id)
  if (!folders || !notes) {
    res.status(HttpStatusCode.BadRequest).send("couldn't find folders or notes")
    return
  }
  const root = genFolder(user.id, folders, notes)
  res.json(RootFolder.parse(root))
})

router.get("/graph", async (req, res) => {
  const user = await userFromQuery(req)
  if (typeof user === "string") {
    res.status(HttpStatusCode.BadRequest).send(user)
    return
  }
  const links = await getUserLinks(user.id)
  if (!links) {
    res.status(HttpStatusCode.BadRequest).send("couldn't find links")
    return
  }
  const graph = genGraph(links)
  res.json(Graph.parse(graph))
})

router.post("/login", async (req, res) => {
  const { name, password } = LogIn.parse(req.body)
  const user = await getUserByName(name)
  if (!user) throw new Error("couldn't find user")

  const password_matched = await bcrypt.compare(
    password,
    user?.encrypted_password,
  )
  if (!password_matched) {
    res.status(HttpStatusCode.BadRequest).send("wrong password")
    return
  }

  const token = sign(user)
  res.cookie("AuthToken", token, { httpOnly: true })
  res.status(HttpStatusCode.Ok).json(User.parse(user))
})

router.post("/signup", async (req, res) => {
  const { name, password } = SignUp.parse(req.body)
  const encrypted_password = await bcrypt.hash(
    password,
    config.bcrypt_salt_rounds,
  )
  const user = await createUser(name, encrypted_password)

  if (!user) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create a user")
    return
  }

  const token = sign(user)
  res.cookie("AuthToken", token, { httpOnly: true })
  res.status(200).json(User.parse(user))
})

router.delete("/logout", async (_, res) => {
  res.clearCookie("AuthToken").sendStatus(200)
})

export default router
