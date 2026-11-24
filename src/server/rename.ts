import { sql } from "kysely"
import { db } from "./models/db.ts"
import { FoldersId, NotesId, UsersId } from "./models/generated/index.ts"
import { getFolder } from "./models/folders.ts"
import { getNote } from "./models/notes.ts"
import { extractLinks } from "./links.ts"
import { rewriteLinks } from "../markdown.ts"
import { childPath, isUnderPath, replacePathPrefix, userPath } from "./paths.ts"

export interface AffectedNote {
  id: number
  user_id: number
  title: string
  path: string
  owner: string
  count: number
}

interface FolderUpdate {
  id: number
  path: string
  title?: string
}

interface NoteUpdate {
  id: number
  user_id: number
  path: string
  title: string
  content: string
}

export interface RenamePlan {
  kind: "note" | "folder"
  target_id: number
  owner_id: number
  old_path: string
  new_path: string
  mapping: Map<string, string>
  folders: FolderUpdate[]
  notes: NoteUpdate[]
  affected: AffectedNote[]
  link_count: number
  cross_user_count: number
}

export type PlanError = "not found" | "forbidden"

export async function planNoteRename(
  note_id: number,
  owner: { id: number; name: string },
  title: string,
): Promise<RenamePlan | PlanError> {
  const note = await getNote(note_id)
  if (!note) return "not found"
  if (note.user_id !== owner.id) return "forbidden"

  const folder = note.folder_id ? await getFolder(note.folder_id) : undefined
  const base = folder ? folder.path : userPath(owner.name)
  const new_path = childPath(base, title)
  const mapping = new Map([[note.path, new_path]])

  return await buildPlan(
    owner,
    "note",
    note.id,
    note.path,
    new_path,
    title,
    mapping,
  )
}

export async function planFolderRename(
  folder_id: number,
  owner: { id: number; name: string },
  title: string,
): Promise<RenamePlan | PlanError> {
  const folder = await getFolder(folder_id)
  if (!folder) return "not found"
  if (folder.user_id !== owner.id) return "forbidden"

  const parent = folder.parent_id
    ? await getFolder(folder.parent_id)
    : undefined
  const base = parent ? parent.path : userPath(owner.name)
  const new_path = childPath(base, title)

  const folders = await db
    .selectFrom("folders")
    .where("user_id", "=", owner.id as UsersId)
    .selectAll()
    .execute()
  const notes = await db
    .selectFrom("notes")
    .where("user_id", "=", owner.id as UsersId)
    .selectAll()
    .execute()

  const mapping = new Map<string, string>()
  for (const item of folders) {
    if (isUnderPath(item.path, folder.path)) {
      mapping.set(
        item.path,
        replacePathPrefix(item.path, folder.path, new_path),
      )
    }
  }
  for (const item of notes) {
    if (isUnderPath(item.path, folder.path)) {
      mapping.set(
        item.path,
        replacePathPrefix(item.path, folder.path, new_path),
      )
    }
  }

  return await buildPlan(
    owner,
    "folder",
    folder.id,
    folder.path,
    new_path,
    title,
    mapping,
  )
}

export async function applyRename(plan: RenamePlan) {
  await db.transaction().execute(async (trx) => {
    for (const folder of plan.folders) {
      await trx
        .updateTable("folders")
        .set({
          path: folder.path,
          title: folder.title,
          date_updated: sql`default`,
        })
        .where("id", "=", folder.id as FoldersId)
        .execute()
    }

    for (const note of plan.notes) {
      await trx
        .updateTable("notes")
        .set({
          path: note.path,
          title: note.title,
          content: note.content,
          date_updated: sql`default`,
        })
        .where("id", "=", note.id as NotesId)
        .execute()
    }

    for (const note of plan.notes) {
      await trx
        .deleteFrom("links")
        .where("from_id", "=", note.id as NotesId)
        .execute()

      const links = extractLinks(note.content)
      if (!links.length) continue

      await trx
        .insertInto("links")
        .values(
          links.map((to_url) => ({
            user_id: note.user_id as UsersId,
            from_id: note.id as NotesId,
            from_url: note.path,
            to_url,
          })),
        )
        .execute()
    }
  })
}

export function mappingList(mapping: Map<string, string>) {
  return Array.from(mapping, ([from, to]) => ({ from, to }))
}

async function buildPlan(
  owner: { id: number; name: string },
  kind: "note" | "folder",
  target_id: number,
  old_path: string,
  new_path: string,
  title: string,
  mapping: Map<string, string>,
): Promise<RenamePlan> {
  const folders = await db
    .selectFrom("folders")
    .where("user_id", "=", owner.id as UsersId)
    .selectAll()
    .execute()
  const allNotes = await db.selectFrom("notes").selectAll().execute()
  const users = await db.selectFrom("users").select(["id", "name"]).execute()
  const userNames = new Map(users.map((user) => [user.id, user.name]))

  const folderUpdates: FolderUpdate[] = []
  for (const folder of folders) {
    const path = mapping.get(folder.path)
    if (!path) continue
    folderUpdates.push({
      id: folder.id,
      path,
      title: kind === "folder" && folder.id === target_id ? title : undefined,
    })
  }

  const notes: NoteUpdate[] = []
  const affected: AffectedNote[] = []
  let link_count = 0

  for (const note of allNotes) {
    const path = mapping.get(note.path) ?? note.path
    const note_title =
      kind === "note" && note.id === target_id ? title : note.title
    const rewritten = rewriteLinks(note.content, mapping)

    if (rewritten.count > 0) {
      affected.push({
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        path: note.path,
        owner: userNames.get(note.user_id) ?? "",
        count: rewritten.count,
      })
      link_count += rewritten.count
    }

    if (
      path !== note.path ||
      note_title !== note.title ||
      rewritten.content !== note.content
    ) {
      notes.push({
        id: note.id,
        user_id: note.user_id,
        path,
        title: note_title,
        content: rewritten.content,
      })
    }
  }

  return {
    kind,
    target_id,
    owner_id: owner.id,
    old_path,
    new_path,
    mapping,
    folders: folderUpdates,
    notes,
    affected,
    link_count,
    cross_user_count: affected.filter((note) => note.user_id !== owner.id)
      .length,
  }
}
