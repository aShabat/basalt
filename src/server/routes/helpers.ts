import { Folder, Note, RootFolder } from "../../schemas/types.ts"
import { Folders, Links, Notes } from "../models/generated/index.ts"

export function genFolder(
  user_id: number,
  folders: Folders[],
  notes: Notes[],
  from?: Folder,
) {
  const folder = from || RootFolder.parse({ user_id, children: [], notes: [] })

  folder.children = folders
    .filter((f) => !(folder.id || f.parent_id) || f.parent_id === folder.id)
    .map((f) =>
      Folder.parse(
        genFolder(
          user_id,
          folders,
          notes,
          Folder.parse({
            ...f,
            parent_id: f.parent_id || undefined,
            children: [],
            notes: [],
          }),
        ),
      ),
    )

  folder.notes = notes
    .filter((n) => !(folder.id || n.folder_id) || folder.id === n.folder_id)
    .map((n) => ({
      ...n,
      folder_id: n.folder_id || undefined,
      content: undefined,
    }))

  return folder
}

function normalizePath(value: string) {
  const path = value.split(/[?#]/)[0]
  if (!path) return path
  try {
    return decodeURI(path)
  } catch {
    return path
  }
}

export function genGraph(
  notes: Notes[],
  links: Links[],
  targets: Notes[],
  viewer_id?: number,
) {
  const nodes: {
    id?: number
    path: string
    title: string
    unresolved: boolean
  }[] = []
  const indexes = new Map<string, number>()

  function addNode(node: {
    id?: number
    path: string
    title: string
    unresolved: boolean
  }) {
    if (indexes.has(node.path)) return
    indexes.set(node.path, nodes.length)
    nodes.push(node)
  }

  for (const note of notes) {
    addNode({
      id: note.id,
      path: note.path,
      title: note.title,
      unresolved: false,
    })
  }

  for (const target of targets) {
    if (target.is_private && target.user_id !== viewer_id) continue
    addNode({
      id: target.id,
      path: target.path,
      title: target.title,
      unresolved: false,
    })
  }

  const seen = new Set<string>()
  const edges: { from: number; to: number; weight: number }[] = []

  for (const link of links) {
    const from = normalizePath(link.from_url)
    const to = normalizePath(link.to_url)
    if (!from || !to || from === to) continue
    if (!indexes.has(from)) continue

    if (!indexes.has(to)) {
      addNode({
        path: to,
        title: to,
        unresolved: true,
      })
    }

    const key = `${from}\u0000${to}`
    if (seen.has(key)) continue
    seen.add(key)

    edges.push({
      from: indexes.get(from)!,
      to: indexes.get(to)!,
      weight: 1,
    })
  }

  return { nodes, edges }
}
