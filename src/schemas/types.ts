import z from "zod"

export const User = z.object({
  id: z.number(),
  name: z.string(),
  date_added: z.date(),
})

export type User = z.infer<typeof User>

export const Note = z.object({
  id: z.number(),
  user_id: z.number(),
  folder_id: z.number().optional(),
  title: z.string(),
  content: z.string(),
  date_added: z.date(),
  date_updated: z.date(),
  path: z.string(),
})

export type Note = z.infer<typeof Note>

const GeneralFolder = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  parent_id: z.number().optional(),
  title: z.string().optional(),
  date_added: z.date(),
  date_updated: z.date(),
  path: z.string(),
  get children() {
    return z.array(Folder)
  },
  notes: z.array(Note.omit({ content: true })),
})

export const Folder = GeneralFolder.safeExtend({
  id: z.number(),
  title: z.string(),
})

export type Folder = z.infer<typeof Folder>

export const RootFolder = GeneralFolder.safeExtend({
  id: z.undefined(),
  parent_id: z.undefined(),
  title: z.undefined(),
})

export type RootFolder = z.infer<typeof RootFolder>

export const Graph = z.object({
  points: z.array(z.string()),
  edges: z.array(
    z.object({ from: z.number(), to: z.number(), weight: z.number() }),
  ),
})
