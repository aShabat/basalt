import { HttpStatusCode } from "axios"
import { Router } from "express"
import { alterNote, createNote, deleteNote, getNote } from "../models/notes.ts"
import { Note } from "../../schemas/types.ts"
import { CreateNote, UpdateNote } from "../../schemas/api.ts"
import { createLinks } from "../models/links.ts"

const router = Router()

router.get("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  const result = await getNote(note_id)
  if (!result) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }
  res.json(Note.parse({ ...result, folder_id: result.folder_id || undefined }))
})

router.put("/", async (req, res) => {
  const { folder_id, title, content, path } = CreateNote.parse(req.body)
  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't create notes for this user_id")
    return
  }
  const result = await createNote(user_id, folder_id, title, path, content)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the note")
    return
  }
  await updateNoteLinks(user_id, result.id, result.path, result.content)
  res.json(Note.parse({ ...result, folder_id: result?.folder_id || undefined }))
})

router.post("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't change notes for this user_id")
    return
  }
  const owner_id = req.user.id

  const { folder_id, title, content, path } = UpdateNote.parse(req.body)

  const note = await getNote(note_id)
  if (!note) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }
  if (note.user_id !== owner_id) {
    res
      .status(HttpStatusCode.Forbidden)
      .send("can't change notes for this user")
    return
  }

  const result = await alterNote(note_id, folder_id, title, path, content)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the note")
    return
  }
  await updateNoteLinks(user_id, result.id, result.path, result.content)
  res.json(Note.parse({ ...result, folder_id: result.folder_id || undefined }))
})

router.delete("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't change notes for this user_id")
    return
  }
  const owner_id = req.user.id

  const note = await getNote(note_id)
  if (!note) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }
  if (note.user_id !== owner_id) {
    res
      .status(HttpStatusCode.Forbidden)
      .send("can't change notes for this user")
    return
  }

  const result = await deleteNote(note_id)
  if (result) res.sendStatus(HttpStatusCode.Ok)
  else res.sendStatus(HttpStatusCode.BadRequest)
})

async function updateNoteLinks(
  user_id: number,
  note_id: number,
  path: string,
  content: string,
) {
  const linkRexp = /\(([^()]+)\)/g
  const links = [...content.matchAll(linkRexp)].map((match) => match[1])
  await createLinks(user_id, note_id, path, links)
}

export default router
