import { HttpStatusCode } from "axios"
import { Request, Response, Router } from "express"
import { CreateFolder, UpdateFolder } from "../../schemas/api.ts"
import {
  alterFolder,
  createFolder,
  deleteFolder,
  getFolder,
} from "../models/folders.ts"

const router = Router()

interface FolderUpdate {
  parent_id?: number
  title?: string
  path?: string
}

router.post("/", async (req, res) => {
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const { parent_id, title, path } = CreateFolder.parse(req.body)
  if (parent_id !== undefined) {
    const parent = await getFolder(parent_id)
    if (!parent || parent.user_id !== owner_id) {
      res.status(HttpStatusCode.Forbidden).send("can't use this folder")
      return
    }
  }

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

router.put("/:folder_id", async (req, res) => {
  await updateExistingFolder(req, res, CreateFolder.parse(req.body))
})

router.patch("/:folder_id", async (req, res) => {
  await updateExistingFolder(req, res, UpdateFolder.parse(req.body))
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

async function updateExistingFolder(
  req: Request,
  res: Response,
  body: FolderUpdate,
) {
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
    res.status(HttpStatusCode.Forbidden).send("can't change this folder")
    return
  }

  if (body.parent_id !== undefined) {
    if (body.parent_id === folder_id) {
      res.status(HttpStatusCode.BadRequest).send("folder can't be its own parent")
      return
    }
    const parent = await getFolder(body.parent_id)
    if (!parent || parent.user_id !== owner_id) {
      res.status(HttpStatusCode.Forbidden).send("can't use this folder")
      return
    }
  }

  const result = await alterFolder(
    owner_id,
    folder_id,
    body.parent_id,
    body.title,
    body.path,
  )
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the folder")
    return
  }
  res.json({ ...result, parent_id: result.parent_id || undefined })
}

export default router
