import { HttpStatusCode } from "axios"
import { Request, Response, Router } from "express"
import { alterNote, createNote, deleteNote, getNote } from "../models/notes.ts"
import { getFolder } from "../models/folders.ts"
import { Note } from "../../schemas/types.ts"
import { CreateNote, UpdateNote } from "../../schemas/api.ts"
import { createLinks } from "../models/links.ts"

const router = Router()

interface NoteUpdate {
  folder_id?: number
  title?: string
  content?: string
  path?: string
  is_private?: boolean
}

router.post("/", async (req, res) => {
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const { folder_id, title, content, path, is_private } = CreateNote.parse(
    req.body,
  )
  if (folder_id !== undefined) {
    const folder = await getFolder(folder_id)
    if (!folder || folder.user_id !== owner_id) {
      res.status(HttpStatusCode.Forbidden).send("can't use this folder")
      return
    }
  }

  const result = await createNote(
    owner_id,
    folder_id,
    title,
    path,
    content,
    is_private,
  )
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't create the note")
    return
  }
  await updateNoteLinks(owner_id, result.id, result.path, result.content)
  res
    .status(HttpStatusCode.Created)
    .json(Note.parse({ ...result, folder_id: result.folder_id || undefined }))
})

router.get("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  const result = await getNote(note_id)
  if (!result) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  if (result.is_private && req.user?.id !== result.user_id) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  res.json(Note.parse({ ...result, folder_id: result.folder_id || undefined }))
})

router.put("/:note_id", async (req, res) => {
  await updateExistingNote(req, res, CreateNote.parse(req.body))
})

router.patch("/:note_id", async (req, res) => {
  await updateExistingNote(req, res, UpdateNote.parse(req.body))
})

router.delete("/:note_id", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const note = await getNote(note_id)
  if (!note) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  if (note.user_id !== owner_id) {
    res.status(HttpStatusCode.Forbidden).send("can't delete this note")
    return
  }

  const result = await deleteNote(owner_id, note_id)
  if (result) res.sendStatus(HttpStatusCode.NoContent)
  else res.sendStatus(HttpStatusCode.BadRequest)
})

async function updateExistingNote(
  req: Request,
  res: Response,
  body: NoteUpdate,
) {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }

  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const note = await getNote(note_id)
  if (!note) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  if (note.user_id !== owner_id) {
    res.status(HttpStatusCode.Forbidden).send("can't change this note")
    return
  }

  if (body.folder_id !== undefined) {
    const folder = await getFolder(body.folder_id)
    if (!folder || folder.user_id !== owner_id) {
      res.status(HttpStatusCode.Forbidden).send("can't use this folder")
      return
    }
  }

  const result = await alterNote(
    owner_id,
    note_id,
    body.folder_id,
    body.title,
    body.path,
    body.content,
    body.is_private,
  )
  if (!result) {
    res.status(HttpStatusCode.BadRequest).send("couldn't alter the note")
    return
  }
  await updateNoteLinks(owner_id, result.id, result.path, result.content)
  res.json(Note.parse({ ...result, folder_id: result.folder_id || undefined }))
}

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
