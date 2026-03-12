import z from "zod"
import { Folder, Graph, Note, RootFolder, User } from "./types.js"

export const SignUp = z.object({
  name: z.string(),
  password: z.string(),
})

export const LogIn = z.object({
  name: z.string(),
  password: z.string(),
})

export const UserData = z.object({
  user: User,
  root_folder: RootFolder,
  graph: Graph,
})

export const CreateNote = Note.omit({ id: true, user_id: true })
export const UpdateNote = CreateNote.partial()

export const CreateFolder = Folder.omit({
  id: true,
  user_id: true,
  children: true,
  notes: true,
})
export const UpdateFolder = CreateFolder.partial()
