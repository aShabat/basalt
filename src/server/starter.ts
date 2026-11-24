import { createLinks } from "./models/links.ts"
import { createNote } from "./models/notes.ts"
import { extractLinks } from "./links.ts"

export const STARTER_TITLE = "Welcome"

export function starterContent(user_name: string) {
  return `# Welcome to Basalt

This is your starter note. Basalt is an Obsidian-light note app: folders,
markdown notes, links between notes, private notes, and an interactive graph.

## Features

- Folder tree with nested notes
- Markdown editing with preview
- Internal links between notes
- Rename notes and folders with link preview and confirmation
- Private notes visible only to you
- Interactive graph with draggable nodes, pan, and zoom

## Links

Write internal links with a note path:

\`[Another note](/${user_name}/Another note)\`

Use the graph to see how your notes connect.

## Privacy

Use the **private** checkbox to hide a note from other users and from the public
graph.

## Project

GitHub: https://github.com/aShabat/basalt_di_final
`
}

export async function createStarterNote(user_id: number, user_name: string) {
  const content = starterContent(user_name)
  const note = await createNote(
    user_id,
    undefined,
    STARTER_TITLE,
    `/${user_name}/${STARTER_TITLE}`,
    content,
    false,
  )

  if (!note) return

  await createLinks(
    user_id,
    note.id,
    note.path,
    extractLinks(content),
  )
  return note
}
