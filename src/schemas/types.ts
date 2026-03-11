import z from "zod"

function preprocessLiteral<T extends string>(literal_value: T) {
  return z.preprocess((val) => val || literal_value, z.literal(literal_value))
}

export const User = z.object({
  id: z.number(),
  name: z.string(),
})

export type User = z.infer<typeof User>

export const Note = z.object({
  kind: preprocessLiteral("note"),
  id: z.number(),
  user_id: z.number(),
  parent_id: z.number(),
  title: z.string(),
  content: z.string(),
})

export type Note = z.infer<typeof Note>

const GeneralFolder = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  parent_id: z.number().optional(),
  title: z.string().optional(),
  get children() {
    return z.array(Folder)
  },
  notes: z.array(Note.omit({ content: true })),
})

export const Folder = GeneralFolder.safeExtend({
  kind: preprocessLiteral("folder"),
  id: z.number(),
  title: z.string(),
})

export type Folder = z.infer<typeof Folder>

export const RootFolder = GeneralFolder.safeExtend({
  kind: preprocessLiteral("root"),
  id: z.undefined(),
  title: z.undefined(),
})

export type RootFolder = z.infer<typeof RootFolder>
