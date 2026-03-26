import { createContext, JSX, useEffect, useState } from "react"
import { Folder, Note, RootFolder, User } from "../../schemas/types"
import { createFolder, createNote, getTree, getUser } from "../api"
import { useParams } from "react-router"
import { useAppSelector } from "../store/store"
import InputField from "./InputField"

interface TreeContextState {
  currentUser?: User
  isEditable: boolean
  setRootFolder: Function
  setReloadFlag: Function
}

const TreeContext = createContext<TreeContextState>({
  isEditable: false,
  setRootFolder: () => {},
  setReloadFlag: () => {},
})

export default function () {
  const { name } = useParams()
  const [currentUser, setCurrentUser] = useState<User>()
  const [rootFolder, setRootFolder] = useState<RootFolder>()
  const [reloadFlag, setReloadFlag] = useState(false)
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)
  const user = useAppSelector(({ auth }) => auth.user)
  const isEditable = currentUser?.id === user?.id

  async function handleNewFolder(title: string) {
    const newRootFolder = await createFolder(currentUser!.id, undefined, title)
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewFolderFlag(false)
  }

  async function handleNewNote(title: string) {
    const newRootFolder = await createNote(currentUser!.id, undefined, title)
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewNoteFlag(false)
  }

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
        console.log(rootFolder)
      }
    })()
  }, [currentUser])

  const folders = rootFolder?.children
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((c) => <FolderRow folder={c} />)
  const notes = rootFolder?.notes
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((n) => <NoteRow note={n} />)

  return (
    <TreeContext
      value={{ currentUser, setRootFolder, isEditable, setReloadFlag }}
    >
      <div>
        {rootFolder ? (
          <>
            <button onClick={() => setNewFolderFlag(true)}> new folder </button>
            <button onClick={() => setNewNoteFlag(true)}> new note </button>
            {newFolderFlag && (
              <InputField name="folder_title" handleInput={handleNewFolder} />
            )}
            {folders}
            {newNoteFlag && (
              <InputField name="note_title" handleInput={handleNewNote} />
            )}
            {notes}
          </>
        ) : (
          "loading"
        )}
      </div>
    </TreeContext>
  )
}

interface FolderRowProps {
  folder: Folder
}
export function FolderRow({ folder }: FolderRowProps) {
  const children = folder.children.map((c) => <FolderRow folder={c} />)
  const notes = folder.notes.map((n) => <NoteRow note={n} />)
  return (
    <div id={`folder_${folder.id}`}>
      {folder.title}
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
