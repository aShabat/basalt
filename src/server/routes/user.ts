import { Router } from "express"
import { createUser, getUserByName } from "../models/users.js"
import { sign } from "../auth.js"
import bcrypt from "bcrypt"
import { LogIn, SignUp, UserData } from "../../schemas/api.ts"
import { HttpStatusCode } from "axios"
import config from "../../config.ts"
import { getUserFolders } from "../models/folders.ts"
import { getUserNotes } from "../models/notes.ts"
import { genFolder, genGraph } from "./helpers.ts"
import { Graph, RootFolder } from "../../schemas/types.ts"
import { getUserLinks } from "../models/links.ts"

const router = Router()

router.get("/", async (req, res) => {
  if (req.user) {
    res.json(req.user)
  } else {
    res.status(HttpStatusCode.BadRequest).send(undefined)
  }
})

router.get("/:name", async (req, res) => {
  const { name } = req.params
  const user = await getUserByName(name)
  if (!user) {
    res.status(HttpStatusCode.BadRequest).send("no user with this name")
    return
  }

  const user_id = user.id
  const folders = await getUserFolders(user_id)
  const notes = await getUserNotes(user_id)

  if (!folders || !notes) {
    res.status(HttpStatusCode.BadRequest).send("couldn't generate note tree")
    return
  }
  const root_folder = RootFolder.parse(genFolder(user_id, folders, notes))

  const links = await getUserLinks(user_id)
  if (!links) {
    res.status(HttpStatusCode.BadRequest).send("couldn't get links")
    return
  }
  const graph = Graph.parse(genGraph(links))

  res.json(UserData.parse({ user, root_folder, graph }))
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
  res.status(HttpStatusCode.Ok).json(user)
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
  res.status(200).json(user)
})

router.post("/logout", async (_, res) => {
  res.clearCookie("AuthToken").sendStatus(200)
})

export default router
