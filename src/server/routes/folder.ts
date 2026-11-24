import { HttpStatusCode } from "axios"
import { Router } from "express"
import { CreateFolder, RenameFolder } from "../../schemas/api.ts"
import {
  createFolder,
  deleteFolder,
  getFolder,
} from "../models/folders.ts"
import { applyRename, mappingList, planFolderRename } from "../rename.ts"

const router = Router()

router.post("/", async (req, res) => {
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const { parent_id, title } = CreateFolder.parse(req.body)
  const parent =
    parent_id !== undefined ? await getFolder(parent_id) : undefined
  if (parent_id !== undefined && (!parent || parent.user_id !== owner_id)) {
    res.status(HttpStatusCode.Forbidden).send("can't use this folder")
    return
  }
  const path = parent
    ? `${parent.path}/${title}`
    : `/${req.user.name}/${title}`

  const result = await createFolder(owner_id, parent_id, title, path)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the folder")
    return
  }
  res
    .status(HttpStatusCode.Created)
    .json({ ...result, parent_id: result.parent_id || undefined })
})

router.get("/:folder_id", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }

  const folder = await getFolder(folder_id)
  if (!folder) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the folder")
    return
  }
  res.json({ ...folder, parent_id: folder.parent_id || undefined })
})

router.post("/:folder_id/rename/preview", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }

  const { title } = RenameFolder.parse(req.body)
  const plan = await planFolderRename(
    folder_id,
    { id: req.user.id, name: req.user.name },
    title,
  )
  if (plan === "not found") {
    res.status(HttpStatusCode.NotFound).send("couldn't find the folder")
    return
  }
  if (plan === "forbidden") {
    res.status(HttpStatusCode.Forbidden).send("can't rename this folder")
    return
  }

  res.json({
    old_path: plan.old_path,
    new_path: plan.new_path,
    link_count: plan.link_count,
    cross_user_count: plan.cross_user_count,
    notes: plan.affected.map(({ id, title, path, owner, count }) => ({
      id,
      title,
      path,
      owner,
      count,
    })),
  })
})

router.post("/:folder_id/rename", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }

  const { title } = RenameFolder.parse(req.body)
  const plan = await planFolderRename(
    folder_id,
    { id: req.user.id, name: req.user.name },
    title,
  )
  if (plan === "not found") {
    res.status(HttpStatusCode.NotFound).send("couldn't find the folder")
    return
  }
  if (plan === "forbidden") {
    res.status(HttpStatusCode.Forbidden).send("can't rename this folder")
    return
  }

  await applyRename(plan)
  const folder = await getFolder(folder_id)
  if (!folder) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the folder")
    return
  }
  res.json({
    folder: {
      id: folder.id,
      title: folder.title,
      path: folder.path,
    },
    mapping: mappingList(plan.mapping),
    link_count: plan.link_count,
  })
})

router.delete("/:folder_id", async (req, res) => {
  const folder_id = +req.params.folder_id
  if (!folder_id) {
    res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
    return
  }

  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const folder = await getFolder(folder_id)
  if (!folder) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the folder")
    return
  }
  if (folder.user_id !== owner_id) {
    res.status(HttpStatusCode.Forbidden).send("can't delete this folder")
    return
  }

  const result = await deleteFolder(owner_id, folder_id)
  if (result) res.sendStatus(HttpStatusCode.NoContent)
  else res.sendStatus(HttpStatusCode.BadRequest)
})

export default router
