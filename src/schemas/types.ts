import z from "zod"

export const User = z.object({
  id: z.number(),
  name: z.string(),
})

export type User = z.infer<typeof User>

export const Note = z.object({
  kind: z.literal("note"),
  id: z.number(),
  title: z.string(),
  parent_id: z.number(),
  content: z.string(),
})

export type Note = z.infer<typeof Note>

const GeneralFolder = z.object({
  kind: z.string(),
  id: z.number().optional(),
  title: z.string().optional(),
  parent_id: z.number().optional(),
  get children() {
    return z.array(Folder)
  },
  notes: z.array(Note.omit({ content: true })),
})

export const Folder = GeneralFolder.safeExtend({
  kind: z.literal("folder"),
  id: z.number(),
  title: z.string(),
})

export type Folder = z.infer<typeof Folder>

export const RootFolder = GeneralFolder.safeExtend({
  kind: z.literal("root"),
  id: z.undefined(),
  title: z.undefined(),
})

export type RootFolder = z.infer<typeof RootFolder>
