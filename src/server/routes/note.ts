import { HttpStatusCode } from "axios"
import { Request, Response, Router } from "express"
import { alterNote, createNote, deleteNote, getNote } from "../models/notes.ts"
import { getFolder } from "../models/folders.ts"
import { Note } from "../../schemas/types.ts"
import { CreateNote, RenameNote, UpdateNote } from "../../schemas/api.ts"
import { createLinks } from "../models/links.ts"
import { extractLinks } from "../links.ts"
import { applyRename, mappingList, planNoteRename } from "../rename.ts"

const router = Router()

router.post("/", async (req, res) => {
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }
  const owner_id = req.user.id

  const { folder_id, title, content, is_private } = CreateNote.parse(req.body)
  const folder =
    folder_id !== undefined ? await getFolder(folder_id) : undefined
  if (folder_id !== undefined && (!folder || folder.user_id !== owner_id)) {
    res.status(HttpStatusCode.Forbidden).send("can't use this folder")
    return
  }
  const path = folder
    ? `${folder.path}/${title}`
    : `/${req.user.name}/${title}`

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

router.post("/:note_id/rename/preview", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }

  const { title } = RenameNote.parse(req.body)
  const plan = await planNoteRename(
    note_id,
    { id: req.user.id, name: req.user.name },
    title,
  )
  if (plan === "not found") {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  if (plan === "forbidden") {
    res.status(HttpStatusCode.Forbidden).send("can't rename this note")
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

router.post("/:note_id/rename", async (req, res) => {
  const note_id = +req.params.note_id
  if (!note_id) {
    res.status(HttpStatusCode.BadRequest).send("note_id should be a number")
    return
  }
  if (!req.user) {
    res.status(HttpStatusCode.Unauthorized).send("not logged in")
    return
  }

  const { title } = RenameNote.parse(req.body)
  const plan = await planNoteRename(
    note_id,
    { id: req.user.id, name: req.user.name },
    title,
  )
  if (plan === "not found") {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  if (plan === "forbidden") {
    res.status(HttpStatusCode.Forbidden).send("can't rename this note")
    return
  }

  await applyRename(plan)
  const note = await getNote(note_id)
  if (!note) {
    res.status(HttpStatusCode.NotFound).send("couldn't find the note")
    return
  }
  res.json({
    note: Note.parse({ ...note, folder_id: note.folder_id || undefined }),
    mapping: mappingList(plan.mapping),
    link_count: plan.link_count,
  })
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
  body: { content?: string; is_private?: boolean },
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

  const result = await alterNote(
    owner_id,
    note_id,
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
  await createLinks(user_id, note_id, path, extractLinks(content))
}

export default router
