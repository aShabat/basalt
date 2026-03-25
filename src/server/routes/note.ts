import { HttpStatusCode } from "axios"
import { Router } from "express"
import { alterNote, createNote, deleteNote, getNote } from "../models/notes.ts"
import { Note } from "../../schemas/types.ts"
import { CreateNote, UpdateNote } from "../../schemas/api.ts"

const router = Router()

router.get("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  const note = await getNote(note_id)
  if (!note) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }
  res.json(Note.parse(note))
})

router.put("/", async (req, res) => {
  const { folder_id, title, content } = CreateNote.parse(req.body)
  const user_id = req.path_user_id!
  if (!req.user || req.user.id !== user_id) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("can't create notes for this user_id")
    return
  }
  const result = await createNote(user_id, folder_id, title, content)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the note")
  }
  res.json(Note.parse(result))
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

  const { folder_id, title, content } = UpdateNote.parse(req.body)

  const note = await getNote(note_id)
  if (!note) {
    res
      .status(HttpStatusCode.BadRequest)
      .send("couldn't find the note with this id")
    return
  }

  const result = await alterNote(note_id, folder_id, title, content)
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the note")
    return
  }
  res.json(Note.parse(result))
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

  const result = await deleteNote(note_id)
  if (result) res.sendStatus(HttpStatusCode.Ok)
  else res.sendStatus(HttpStatusCode.BadRequest)
})

export default router
