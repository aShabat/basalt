import { Folder, RootFolder } from "../schemas/types"

export function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/")
}

export function decodePath(path: string) {
  return path.split("/").map(decodeURIComponent).join("/")
}

export function isUnderPath(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function findNoteIdByPath(
  folder: Folder | RootFolder,
  path: string,
): number | undefined {
  for (const note of folder.notes) {
    if (note.path === path) return note.id
  }
  for (const child of folder.children) {
    const id = findNoteIdByPath(child, path)
    if (id) return id
  }
}

export function findFolderByPath(
  folder: Folder | RootFolder,
  path: string,
): Folder | undefined {
  for (const child of folder.children) {
    if (child.path === path) return child
    const found = findFolderByPath(child, path)
    if (found) return found
  }
}
