import { createContext, Fragment, useContext, useEffect, useState } from "react"
import { Folder, Note, RootFolder, User } from "../../schemas/types"
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getTree,
  getUser,
} from "../api"
import { useNavigate, useParams } from "react-router"
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
      }
    })()
  }, [currentUser])

  const folders = rootFolder?.children
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((c) => (
      <Fragment key={c.id}>
        <FolderRow folder={c} path={[currentUser!.name]} />
      </Fragment>
    ))
  const notes = rootFolder?.notes
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((n) => (
      <Fragment key={n.id}>
        <NoteRow note={n} path={[currentUser!.name]} />
      </Fragment>
    ))

  return (
    <TreeContext
      value={{ currentUser, setRootFolder, isEditable, setReloadFlag }}
    >
      <div id="root_folder">
        {rootFolder ? (
          <>
            <button onClick={() => setNewFolderFlag(true)}> new folder </button>
            <button onClick={() => setNewNoteFlag(true)}> new note </button>
            {newFolderFlag && (
              <InputField
                name="folder_title"
                handleInput={handleNewFolder}
                handleCancel={() => setNewFolderFlag(false)}
              />
            )}
            {folders}
            {newNoteFlag && (
              <InputField
                name="note_title"
                handleInput={handleNewNote}
                handleCancel={() => setNewNoteFlag(false)}
              />
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
  path: string[]
}
export function FolderRow({ folder, path: propPath }: FolderRowProps) {
  const path = [...propPath, folder.title]

  const { currentUser, setRootFolder, isEditable } = useContext(TreeContext)
  const [fold, setFold] = useState(true)
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)

  const children = folder.children.map((c) => (
    <Fragment key={c.id}>
      <FolderRow folder={c} path={path} />
    </Fragment>
  ))
  const notes = folder.notes.map((n) => (
    <Fragment key={n.id}>
      <NoteRow note={n} path={path} />
    </Fragment>
  ))

  async function handleNewFolder(title: string) {
    const newRootFolder = await createFolder(currentUser!.id, folder.id, title)
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewFolderFlag(false)
  }

  async function handleNewNote(title: string) {
    const newRootFolder = await createNote(currentUser!.id, folder.id, title)
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewNoteFlag(false)
  }

  async function handleDelete() {
    const newRootFolder = await deleteFolder(currentUser!.id, folder.id)
    if (newRootFolder) setRootFolder(newRootFolder)
  }

  return (
    <div id={`folder_${folder.id}`} className="folder_row">
      <div onClick={() => setFold(!fold)}>
        {folder.title}
        {isEditable && (
          <>
            <button
              onClick={() => {
                setFold(true)
                setNewFolderFlag(true)
              }}
            >
              new folder
            </button>
            <button
              onClick={() => {
                setFold(true)
                setNewNoteFlag(true)
              }}
            >
              new note
            </button>
            <button onClick={handleDelete}> delete </button>
          </>
        )}
      </div>
      {fold || (
        <>
          {newFolderFlag && (
            <InputField
              name="folder_title"
              handleInput={handleNewFolder}
              handleCancel={() => setNewFolderFlag(false)}
            />
          )}
          {children}
          {newNoteFlag && (
            <InputField
              name="note_title"
              handleInput={handleNewNote}
              handleCancel={() => setNewNoteFlag(false)}
            />
          )}
          {notes}
        </>
      )}
    </div>
  )
}

interface NoteRowProps {
  note: Omit<Note, "content">
  path: string[]
}
export function NoteRow({ note, path: propPath }: NoteRowProps) {
  const path = [...propPath, note.title]
  const { currentUser, setRootFolder, isEditable } = useContext(TreeContext)
  const navigate = useNavigate()

  async function handleDelete() {
    const newRootFolder = await deleteNote(currentUser!.id, note.id)
    if (newRootFolder) setRootFolder(newRootFolder)
  }
  function onClick() {
    navigate(`/${path!.join("/")}`)
  }

  return (
    <div id={`note_${note.id}`} className="note_row" onClick={onClick}>
      {note.title}
      {isEditable && <button onClick={handleDelete}> delete </button>}
    </div>
  )
}
