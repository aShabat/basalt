import { JSX, useEffect, useState } from "react"
import { Folder, Note, RootFolder, User } from "../../schemas/types"
import { getTree, getUser } from "../api"
import { useParams } from "react-router"

interface FolderRowProps {
  folder: Folder
  setRootFolder: Function
}
export function FolderRow({
  folder,
  setRootFolder: setRootTree,
}: FolderRowProps) {
  const children = folder.children.map((c) => (
    <FolderRow folder={c} setRootFolder={setRootTree} />
  ))
  const notes = folder.notes.map((n) => <NoteRow note={n} />)
  return (
    <div id={`folder_${folder.id}`}>
      {children}
      {notes}
    </div>
  )
}

interface NoteRowProps {
  note: Omit<Note, "content">
}
export function NoteRow({ note }: NoteRowProps) {
  return <div id={`note_${note.id}`}>{note.title}</div>
}

export default function () {
  const { name } = useParams()
  const [currentUser, setCurrentUser] = useState<User>()
  const [rootFolder, setRootFolder] = useState<RootFolder>()
  const [reloadFlag, setReloadFlag] = useState(false)

  async function createFolder() {}
  async function createNote() {}

  useEffect(() => {
    ;(async () => {
      if (!currentUser || currentUser.name !== name)
        setCurrentUser(await getUser({ name }))
    })()
  }, [name])

  useEffect(() => {
    ;(async () => {
      if (
        name &&
        (!rootFolder || rootFolder.id !== currentUser?.id || reloadFlag)
      ) {
        setRootFolder(await getTree({ name }))
        setReloadFlag(false)
      }
    })()
  }, [currentUser])

  let folders, notes: JSX.Element[] | undefined
  if (rootFolder) {
    folders = rootFolder.children.map((c) => (
      <FolderRow folder={c} setRootFolder={setRootFolder} />
    ))
    notes = rootFolder.notes.map((n) => <NoteRow note={n} />)
  }
  return (
    <div>
      {rootFolder ? (
        <>
          <button onClick={createFolder}> new folder </button>
          <button onClick={createNote}> new note </button>
          {folders}
          {notes}
        </>
      ) : (
        "loading"
      )}
    </div>
  )
}
