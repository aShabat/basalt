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

export function genGraph(links: Links[]) {
  const points = Array.from(
    new Set(links.map((l) => l.from_url)).union(
      new Set(links.map((l) => l.to_url)),
    ),
  )

  const edges = []
  for (let from = 0; from < points.length; from++) {
    for (let to = from + 1; to < points.length; to++) {
      const weight = links.filter(
        ({ from_url, to_url }) =>
          (from_url === points[from] && to_url === points[to]) ||
          (from_url === points[to] && to_url === points[from]),
      ).length
      if (weight > 0) edges.push({ from, to, weight })
    }
  }

  return { points, edges }
}
