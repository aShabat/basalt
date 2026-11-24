import z from "zod"
import { Folder, Note, Title, UserName } from "./types.js"

export const SignUp = z.object({
  name: UserName,
  password: z.string(),
})

export const LogIn = z.object({
  name: UserName,
  password: z.string(),
})

const NoteInput = Note.omit({
  id: true,
  user_id: true,
  date_added: true,
  date_updated: true,
  is_private: true,
  path: true,
})

export const CreateNote = NoteInput.safeExtend({
  is_private: z.boolean().default(false),
})
export const UpdateNote = z.object({
  content: z.string().optional(),
  is_private: z.boolean().optional(),
})

export const CreateFolder = Folder.omit({
  id: true,
  user_id: true,
  children: true,
  notes: true,
  date_added: true,
  date_updated: true,
  path: true,
})

export const RenameNote = z.object({ title: Title })
export const RenameFolder = z.object({ title: Title })

export const PathMapping = z.object({
  from: z.string(),
  to: z.string(),
})

export const RenamePreview = z.object({
  old_path: z.string(),
  new_path: z.string(),
  link_count: z.number(),
  cross_user_count: z.number(),
  notes: z.array(
    z.object({
      id: z.number(),
      title: Title,
      path: z.string(),
      owner: z.string(),
      count: z.number(),
    }),
  ),
})

export type RenamePreview = z.infer<typeof RenamePreview>

export const RenameNoteResult = z.object({
  note: Note,
  mapping: z.array(PathMapping),
  link_count: z.number(),
})

export const RenameFolderResult = z.object({
  folder: z.object({
    id: z.number(),
    title: Title,
    path: z.string(),
  }),
  mapping: z.array(PathMapping),
  link_count: z.number(),
})
