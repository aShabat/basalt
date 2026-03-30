import { createContext, Fragment, useContext, useEffect, useState } from "react"
import { Folder, Note, RootFolder, User } from "../../schemas/types"
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getNote,
  getTree,
  getUser,
} from "../api"
import { useLocation, useNavigate, useParams } from "react-router"
import { useAppSelector } from "../store/store"
import InputField from "./InputField"

interface TreeContextState {
  currentUser?: User
  currentPath: string[]
  isEditable: boolean
  setRootFolder: Function
  setReloadFlag: Function
  setCurrentNote: Function
}

const TreeContext = createContext<TreeContextState>({
  currentPath: [],
  isEditable: false,
  setRootFolder: () => {},
  setReloadFlag: () => {},
  setCurrentNote: () => {},
})

interface Props {
  setCurrentNote: Function
}
export default function ({ setCurrentNote }: Props) {
  const { name } = useParams()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<User>()
  const [rootFolder, setRootFolder] = useState<RootFolder>()
  const [reloadFlag, setReloadFlag] = useState(false)
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)
  const navigate = useNavigate()
  const user = useAppSelector(({ auth }) => auth.user)
  const isEditable = currentUser?.id === user?.id

  async function handleNewFolder(title: string) {
    const newRootFolder = await createFolder(
      currentUser!.id,
      undefined,
      title,
      `/${currentUser!.name}/${title}`,
    )
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewFolderFlag(false)
  }

  async function handleNewNote(title: string) {
    const newRootFolder = await createNote(
      currentUser!.id,
      undefined,
      title,
      `/${currentUser!.name}/${title}`,
    )
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

  useEffect(() => {
    if (!rootFolder || !currentUser) return
    const path = location.pathname.split("/").slice(1)
    let folder: RootFolder | Folder = rootFolder
    for (let i = 1; i < path.length; i++) {
      const nextFolder: number = folder.children.findIndex(
        (c) => c.title === path[i],
      )
      if (nextFolder > -1) {
        folder = folder.children[nextFolder]
        continue
      }
      const nextNote = folder.notes.findIndex((n) => n.title === path[i])
      if (nextNote > -1) {
        if (i + 1 !== path.length)
          navigate(`/${path.slice(0, i + 1).join("/")}`)
        else {
          ;(async () => {
            const currentNote = await getNote(
              currentUser.id,
              folder.notes[nextNote].id,
            )
            setCurrentNote(currentNote)
          })()
        }
        break
      }

      navigate(`/${path.slice(0, i).join("/")}`)
      setCurrentNote(undefined)
    }
  }, [location, rootFolder])

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
      value={{
        currentUser,
        currentPath: location.pathname.split("/").slice(1),
        setRootFolder,
        isEditable,
        setReloadFlag,
        setCurrentNote,
      }}
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

function isOnPath(path: string[], currentPath: string[]) {
  if (path.length > currentPath.length) return false
  for (let i = 0; i < path.length; i++) {
    if (path[i] !== currentPath[i]) return false
  }
  return true
}

interface FolderRowProps {
  folder: Folder
  path: string[]
}
export function FolderRow({ folder, path: propPath }: FolderRowProps) {
  const path = [...propPath, folder.title]

  const { currentUser, setRootFolder, isEditable, currentPath } =
    useContext(TreeContext)
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)

  const initialFold = isOnPath(path, currentPath)
  const [fold, setFold] = useState(!initialFold)

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
    const newRootFolder = await createFolder(
      currentUser!.id,
      folder.id,
      title,
      `${path}/${title}`,
    )
    if (newRootFolder) setRootFolder(newRootFolder)
    setNewFolderFlag(false)
  }

  async function handleNewNote(title: string) {
    const newRootFolder = await createNote(
      currentUser!.id,
      folder.id,
      title,
      `${path}/${title}`,
    )
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
              onClick={(e) => {
                e.stopPropagation()
                setFold(false)
                setNewFolderFlag(true)
              }}
            >
              new folder
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setFold(false)
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
              handleCancel={() => {
                setNewFolderFlag(false)
              }}
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
