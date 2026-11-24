import { HttpStatusCode } from "axios"
import { Router } from "express"
import { CreateFolder, UpdateFolder } from "../../schemas/api.ts"
import {
  alterFolder,
  createFolder,
  deleteFolder,
  getFolder,
} from "../models/folders.ts"

const router = Router()

router.put("/", async (req, res) => {
  const { parent_id, title, path } = CreateFolder.parse(req.body)
  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't create folders for this user_id")
    return
  }
  const result = await createFolder(user_id, parent_id, title, path)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the folder")
    return
  }
  res.sendStatus(HttpStatusCode.Ok)
})

router.post("/:folder_id", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }

  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't change folders for this user_id")
    return
  }
  const owner_id = req.user.id

  const { parent_id, title, path } = UpdateFolder.parse(req.body)

  const folder = await getFolder(folder_id)
  if (!folder) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the folder with this id")
    return
  }
  if (folder.user_id !== owner_id) {
    res
      .status(HttpStatusCode.Forbidden)
      .send("can't change folders for this user")
    return
  }

  const result = await alterFolder(folder_id, parent_id, title, path)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the folder")
    return
  }
  res.sendStatus(HttpStatusCode.Ok)
})

router.delete("/:folder_id", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }

  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't change folders for this user_id")
    return
  }
  const owner_id = req.user.id

  const folder = await getFolder(folder_id)
  if (!folder) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the folder with this id")
    return
  }
  if (folder.user_id !== owner_id) {
    res
      .status(HttpStatusCode.Forbidden)
      .send("can't change folders for this user")
    return
  }

  const result = await deleteFolder(folder_id)
  if (result) res.sendStatus(HttpStatusCode.Ok)
  else res.sendStatus(HttpStatusCode.BadRequest)
})

export default router
