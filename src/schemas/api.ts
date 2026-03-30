import z from "zod"
import { Folder, Note } from "./types.js"

export const SignUp = z.object({
  name: z.string(),
  password: z.string(),
})

export const LogIn = z.object({
  name: z.string(),
  password: z.string(),
})

export const CreateNote = Note.omit({
  id: true,
  user_id: true,
  date_added: true,
  date_updated: true,
})
export const UpdateNote = CreateNote.partial()

export const CreateFolder = Folder.omit({
  id: true,
  user_id: true,
  children: true,
  notes: true,
  date_added: true,
  date_updated: true,
})
export const UpdateFolder = CreateFolder.partial()
