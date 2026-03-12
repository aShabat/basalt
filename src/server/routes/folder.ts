import { HttpStatusCode } from "axios"
import { Router } from "express"
import { alterNote, createNote, deleteNote, getNote } from "../models/notes.ts"
import { Folder, Note } from "../../schemas/types.ts"
import {
  CreateFolder,
  CreateNote,
  UpdateFolder,
  UpdateNote,
} from "../../schemas/api.ts"
import {
  alterFolder,
  createFolder,
  deleteFolder,
  getFolder,
} from "../models/folders.ts"

const router = Router().use("/user/:user_id/note")

// router.get("/:folder_id", async (req, res) => {
//   const folder_id = +req.params.folder_id
//   if (!folder_id) {
//     res.status(HttpStatusCode.BadRequest).send("folder_id should be a number")
//     return
//   }
//
//   const note = await getFolder(folder_id)
//   if (!note) {
//     res
//       .status(HttpStatusCode.BadRequest)
//       .send("couldn't find the note with this id")
//     return
//   }
//   res.json(Folder.parse(note))
// })

router.put("/", async (req, res) => {
  const { parent_id, title } = CreateFolder.parse(req.body)
  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't create folders for this user_id")
    return
  }
  const result = await createFolder(user_id, parent_id, title)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the folder")
  }
  res.redirect("/api/user/tree")
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
      .send("can't change notes for this user_id")
    return
  }

  const { parent_id, title } = UpdateFolder.parse(req.body)

  const note = await getNote(folder_id)
  if (!note) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }

  const result = await alterFolder(folder_id, parent_id, title)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the note")
    return
  }
  res.redirect("/api/user/tree")
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
      .send("can't change notes for this user_id")
    return
  }

  const result = await deleteFolder(folder_id)
  if (result) res.redirect("/api/user/tree")
  else res.sendStatus(HttpStatusCode.BadRequest)
})

export default router
