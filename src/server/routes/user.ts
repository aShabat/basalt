import bcrypt from "bcrypt"
import { HttpStatusCode } from "axios"
import { Router } from "express"
import { SignUp } from "../../schemas/api.ts"
import { Graph, RootFolder, User } from "../../schemas/types.ts"
import { sign } from "../auth.ts"
import { createUser, getUser, getUserByName } from "../models/users.ts"
import { getUserFolders } from "../models/folders.ts"
import { getNotesByPaths, getUserNotes } from "../models/notes.ts"
import { getUserLinks } from "../models/links.ts"
import { genFolder, genGraph } from "./helpers.ts"
import config from "../../config.ts"

const router = Router()

router.post("/", async (req, res) => {
  const { name, password } = SignUp.parse(req.body)
  if (await getUserByName(name)) {
    res.status(HttpStatusCode.Conflict).send("user already exists")
    return
  }

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
  res.cookie("AuthToken", token, { httpOnly: true, sameSite: "lax" })
  res.status(HttpStatusCode.Created).json(User.parse(user))
})

router.get("/", async (req, res) => {
  const { name } = req.query
  if (typeof name !== "string" || !name) {
    res.status(HttpStatusCode.BadRequest).send("name query is required")
    return
  }

  const user = await getUserByName(name)
  if (!user) {
    res.status(HttpStatusCode.NotFound).send("couldn't find user")
    return
  }
  res.json(User.parse(user))
})

router.get("/me", async (req, res) => {
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  res.json(User.parse(req.user))
})

router.get("/:user_id", async (req, res) => {
  const user_id = +req.params.user_id
  if (!user_id) {
    res.status(HttpStatusCode.BadRequest).send("user_id should be a number")
    return
  }

  const user = await getUser(user_id)
  if (!user) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the user")
    return
  }
  res.json(User.parse(user))
})

router.get("/:user_id/tree", async (req, res) => {
  const user_id = +req.params.user_id
  if (!user_id) {
    res.status(HttpStatusCode.BadRequest).send("user_id should be a number")
    return
  }

  const user = await getUser(user_id)
  if (!user) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the user")
    return
  }

  const folders = await getUserFolders(user_id)
  const notes = await getUserNotes(user_id, req.user?.id === user_id)
  if (!folders || !notes) {
    res
      .status(HttpStatusCode.InternalServerError)
      .send("couldn't find folders or notes")
    return
  }

  const root = genFolder(user_id, folders, notes)
  res.json(RootFolder.parse(root))
})

router.get("/:user_id/graph", async (req, res) => {
  const user_id = +req.params.user_id
  if (!user_id) {
    res.status(HttpStatusCode.BadRequest).send("user_id should be a number")
    return
  }

  const user = await getUser(user_id)
  if (!user) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the user")
    return
  }

  const include_private = req.user?.id === user_id
  const notes = await getUserNotes(user_id, include_private)
  const links = await getUserLinks(user_id, include_private)
  if (!notes || !links) {
    res
      .status(HttpStatusCode.InternalServerError)
      .send("couldn't find notes or links")
    return
  }

  const ownPaths = new Set(notes.map((note) => note.path))
  const targetPaths = [
    ...new Set(
      links
        .map((link) => link.to_url.split(/[?#]/)[0])
        .filter((path) => path && !ownPaths.has(path)),
    ),
  ]
  const targets = await getNotesByPaths(targetPaths)
  if (!targets) {
    res
      .status(HttpStatusCode.InternalServerError)
      .send("couldn't find link targets")
    return
  }

  res.json(Graph.parse(genGraph(notes, links, targets, req.user?.id)))
})

export default router
