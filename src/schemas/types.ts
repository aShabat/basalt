import z from "zod"

export const Title = z
  .string()
  .trim()
  .min(1)
  .refine((title) => !title.includes("/"), "title can't contain /")

export const User = z.object({
  id: z.number(),
  name: z.string(),
  date_added: z.coerce.date(),
})

export type User = z.infer<typeof User>

export const Note = z.object({
  id: z.number(),
  user_id: z.number(),
  folder_id: z.number().optional(),
  title: Title,
  content: z.string(),
  is_private: z.boolean(),
  date_added: z.coerce.date(),
  date_updated: z.coerce.date(),
  path: z.string(),
})

export type Note = z.infer<typeof Note>

const GeneralFolder = z.object({
  id: z.number().optional(),
  user_id: z.number(),
  parent_id: z.number().optional(),
  title: Title.optional(),
  date_added: z.coerce.date().optional(),
  date_updated: z.coerce.date().optional(),
  path: z.string().optional(),
  get children() {
    return z.array(Folder)
  },
  notes: z.array(Note.omit({ content: true })),
})

export const Folder = GeneralFolder.safeExtend({
  id: z.number(),
  title: Title,
  path: z.string(),
  date_added: z.coerce.date(),
  date_updated: z.coerce.date(),
})

export type Folder = z.infer<typeof Folder>

export const RootFolder = GeneralFolder.safeExtend({
  id: z.undefined(),
  parent_id: z.undefined(),
  title: z.undefined(),
  date_added: z.undefined(),
  date_updated: z.undefined(),
})

export type RootFolder = z.infer<typeof RootFolder>

export const Graph = z.object({
  points: z.array(z.string()),
  edges: z.array(
    z.object({ from: z.number(), to: z.number(), weight: z.number() }),
  ),
})

export type Graph = z.infer<typeof Graph>
