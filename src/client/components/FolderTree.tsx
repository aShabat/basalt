import {
  createContext,
  Fragment,
  type MouseEvent as ReactMouseEvent,
  useContext,
  useEffect,
  useState,
} from "react"
import { Folder, Note, RootFolder, User } from "../../schemas/types"
import { RenamePreview } from "../../schemas/api"
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getNote,
  getTree,
  getUser,
  previewFolderRename,
  renameFolder,
} from "../api"
import { useLocation, useNavigate, useParams } from "react-router"
import { useAppSelector } from "../store/store"
import InputField from "./InputField"
import RenameLinksModal from "./RenameLinksModal"
import {
  decodePath,
  encodePath,
  findFolderByPath,
  findNoteIdByPath,
  isUnderPath,
} from "../paths"

interface PathMapping {
  from: string
  to: string
}

interface TreeContextState {
  currentUser?: User
  currentPath: string
  isEditable: boolean
  setRootFolder: Function
  setError: Function
  onPathsChanged: Function
  showTip: (label: string, x: number, y: number) => void
  hideTip: () => void
}

const TreeContext = createContext<TreeContextState>({
  currentPath: "",
  isEditable: false,
  setRootFolder: () => {},
  setError: () => {},
  onPathsChanged: () => {},
  showTip: () => {},
  hideTip: () => {},
})

interface Tip {
  label: string
  x: number
  y: number
  above: boolean
}

interface TreeActionProps {
  label: string
  icon: string
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void
}

function TreeAction({ label, icon, onClick }: TreeActionProps) {
  const { showTip, hideTip } = useContext(TreeContext)

  return (
    <button
      className="tree_action"
      aria-label={label}
      onClick={(event) => {
        hideTip()
        onClick(event)
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse")
          showTip(label, event.clientX, event.clientY)
      }}
      onPointerLeave={hideTip}
    >
      <span className="icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  )
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "request failed"
}

interface Props {
  setCurrentNote: Function
  refreshKey: number
  onPathsChanged: (mapping: PathMapping[]) => void
}
export default function ({
  setCurrentNote,
  refreshKey,
  onPathsChanged,
}: Props) {
  const { name } = useParams()
  const location = useLocation()
  const currentPath = decodePath(location.pathname)
  const [currentUser, setCurrentUser] = useState<User>()
  const [rootFolder, setRootFolder] = useState<RootFolder>()
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)
  const [error, setError] = useState("")
  const [tip, setTip] = useState<Tip>()
  const user = useAppSelector(({ auth }) => auth.user)
  const isEditable = currentUser?.id === user?.id

  function showTip(label: string, x: number, y: number) {
    setTip({ label, x, y, above: y > 50 })
  }

  function hideTip() {
    setTip(undefined)
  }

  async function handleNewFolder(title: string) {
    setError("")
    try {
      const newRootFolder = await createFolder(
        currentUser!.id,
        undefined,
        title,
      )
      if (newRootFolder) setRootFolder(newRootFolder)
      setNewFolderFlag(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleNewNote(title: string) {
    setError("")
    try {
      const newRootFolder = await createNote(currentUser!.id, undefined, title)
      if (newRootFolder) setRootFolder(newRootFolder)
      setNewNoteFlag(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  useEffect(() => {
    ;(async () => {
      if (currentUser && currentUser.name === name) return
      setError("")
      setCurrentUser(undefined)
      setRootFolder(undefined)
      setCurrentNote(undefined)
      try {
        setCurrentUser(await getUser({ name }))
      } catch (err) {
        setError(errorMessage(err))
      }
    })()
  }, [name])

  useEffect(() => {
    ;(async () => {
      if (!currentUser) return
      setError("")
      try {
        const tree = await getTree(currentUser.id)
        if (tree) setRootFolder(tree)
      } catch (err) {
        setError(errorMessage(err))
      }
    })()
  }, [currentUser, user?.id, refreshKey])

  useEffect(() => {
    if (!rootFolder || !currentUser) return
    const note_id = findNoteIdByPath(rootFolder, currentPath)
    if (note_id) {
      ;(async () => {
        setError("")
        try {
          setCurrentNote(await getNote(note_id))
        } catch (err) {
          setError(errorMessage(err))
          setCurrentNote(undefined)
        }
      })()
      return
    }
    if (
      currentPath === `/${currentUser.name}` ||
      findFolderByPath(rootFolder, currentPath)
    ) {
      setCurrentNote(undefined)
      return
    }
    setError("couldn't find that note")
    setCurrentNote(undefined)
  }, [currentPath, rootFolder, currentUser])

  const folders = rootFolder?.children
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((c) => (
      <Fragment key={c.id}>
        <FolderRow folder={c} />
      </Fragment>
    ))
  const notes = rootFolder?.notes
    .toSorted((a, b) => (a.title < b.title ? -1 : 1))
    .map((n) => (
      <Fragment key={n.id}>
        <NoteRow note={n} />
      </Fragment>
    ))

  return (
    <TreeContext
      value={{
        currentUser,
        currentPath,
        isEditable,
        setRootFolder,
        setError,
        onPathsChanged,
        showTip,
        hideTip,
      }}
    >
      <div id="root_folder" className="tree">
        {error && <div className="error"> {error} </div>}
        {rootFolder ? (
          <>
            {isEditable && (
              <>
                <TreeAction
                  label="new folder"
                  icon="📁"
                  onClick={() => setNewFolderFlag(true)}
                />
                <TreeAction
                  label="new note"
                  icon="📝"
                  onClick={() => setNewNoteFlag(true)}
                />
              </>
            )}
            {isEditable && newFolderFlag && (
              <InputField
                name="folder_title"
                handleInput={handleNewFolder}
                handleCancel={() => setNewFolderFlag(false)}
              />
            )}
            {folders}
            {isEditable && newNoteFlag && (
              <InputField
                name="note_title"
                handleInput={handleNewNote}
                handleCancel={() => setNewNoteFlag(false)}
              />
            )}
            {notes}
          </>
        ) : !error ? (
          "loading"
        ) : null}
      </div>
      {tip && (
        <div
          className="tree_tip"
          style={{
            left: tip.x,
            top: tip.y + (tip.above ? -8 : 18),
            transform: tip.above
              ? "translate(-50%, -100%)"
              : "translateX(-50%)",
          }}
        >
          {tip.label}
        </div>
      )}
    </TreeContext>
  )
}

interface FolderRowProps {
  folder: Folder
}
export function FolderRow({ folder }: FolderRowProps) {
  const {
    currentUser,
    currentPath,
    setRootFolder,
    isEditable,
    setError,
    onPathsChanged,
  } = useContext(TreeContext)
  const [fold, setFold] = useState(!isUnderPath(currentPath, folder.path))
  const [newFolderFlag, setNewFolderFlag] = useState(false)
  const [newNoteFlag, setNewNoteFlag] = useState(false)
  const [renameFlag, setRenameFlag] = useState(false)
  const [renameTitle, setRenameTitle] = useState(folder.title)
  const [renamePreview, setRenamePreview] = useState<RenamePreview>()
  const [renamePending, setRenamePending] = useState(false)
  const [renameError, setRenameError] = useState("")

  useEffect(() => {
    if (isUnderPath(currentPath, folder.path)) setFold(false)
  }, [currentPath, folder.path])

  const children = folder.children.map((c) => (
    <Fragment key={c.id}>
      <FolderRow folder={c} />
    </Fragment>
  ))
  const notes = folder.notes.map((n) => (
    <Fragment key={n.id}>
      <NoteRow note={n} />
    </Fragment>
  ))

  async function handleNewFolder(title: string) {
    setError("")
    try {
      const newRootFolder = await createFolder(currentUser!.id, folder.id, title)
      if (newRootFolder) setRootFolder(newRootFolder)
      setNewFolderFlag(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleNewNote(title: string) {
    setError("")
    try {
      const newRootFolder = await createNote(currentUser!.id, folder.id, title)
      if (newRootFolder) setRootFolder(newRootFolder)
      setNewNoteFlag(false)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleDelete() {
    setError("")
    try {
      const newRootFolder = await deleteFolder(currentUser!.id, folder.id)
      if (newRootFolder) setRootFolder(newRootFolder)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function applyRename(title: string) {
    setRenameError("")
    setRenamePending(true)
    try {
      const result = await renameFolder(folder.id, title)
      const newRootFolder = await getTree(currentUser!.id)
      if (newRootFolder) setRootFolder(newRootFolder)
      setRenameFlag(false)
      setRenamePreview(undefined)
      onPathsChanged(result.mapping)
    } catch (err) {
      setRenameError(errorMessage(err))
    } finally {
      setRenamePending(false)
    }
  }

  async function handleRename(title: string) {
    setRenameError("")
    setRenameTitle(title)
    try {
      const preview = await previewFolderRename(folder.id, title)
      if (!preview.notes.length) {
        await applyRename(title)
        return
      }
      setRenamePreview(preview)
    } catch (err) {
      setRenameError(errorMessage(err))
    }
  }

  return (
    <div id={`folder_${folder.id}`} className="folder_row">
      <div className="folder_label" onClick={() => setFold(!fold)}>
        <span>{folder.title}</span>
        {isEditable && (
          <span className="row_actions">
            <TreeAction
              label="new folder"
              icon="📁"
              onClick={(event) => {
                event.stopPropagation()
                setFold(false)
                setNewFolderFlag(true)
              }}
            />
            <TreeAction
              label="new note"
              icon="📝"
              onClick={(event) => {
                event.stopPropagation()
                setFold(false)
                setNewNoteFlag(true)
              }}
            />
            <TreeAction
              label="rename folder"
              icon="✏️"
              onClick={(event) => {
                event.stopPropagation()
                setFold(false)
                setRenameTitle(folder.title)
                setRenameFlag(true)
              }}
            />
            <TreeAction
              label="delete folder"
              icon="🗑️"
              onClick={(event) => {
                event.stopPropagation()
                handleDelete()
              }}
            />
          </span>
        )}
      </div>
      {isEditable && renameFlag && (
        <InputField
          name="folder_title"
          initialValue={folder.title}
          handleInput={handleRename}
          handleCancel={() => {
            setRenameFlag(false)
            setRenameError("")
          }}
        />
      )}
      {renameError && !renamePreview && (
        <div className="error"> {renameError} </div>
      )}
      {renamePreview && (
        <RenameLinksModal
          preview={renamePreview}
          pending={renamePending}
          error={renameError}
          onCancel={() => {
            setRenamePreview(undefined)
            setRenameFlag(false)
            setRenameError("")
          }}
          onConfirm={() => applyRename(renameTitle)}
        />
      )}
      {fold || (
        <div className="tree_children">
          {isEditable && newFolderFlag && (
            <InputField
              name="folder_title"
              handleInput={handleNewFolder}
              handleCancel={() => {
                setNewFolderFlag(false)
              }}
            />
          )}
          {children}
          {isEditable && newNoteFlag && (
            <InputField
              name="note_title"
              handleInput={handleNewNote}
              handleCancel={() => setNewNoteFlag(false)}
            />
          )}
          {notes}
        </div>
      )}
    </div>
  )
}

interface NoteRowProps {
  note: Omit<Note, "content">
}
export function NoteRow({ note }: NoteRowProps) {
  const { currentUser, currentPath, setRootFolder, isEditable, setError } =
    useContext(TreeContext)
  const navigate = useNavigate()

  async function handleDelete() {
    setError("")
    try {
      const newRootFolder = await deleteNote(currentUser!.id, note.id)
      if (newRootFolder) setRootFolder(newRootFolder)
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  function onClick() {
    navigate(encodePath(note.path))
  }

  return (
    <div
      id={`note_${note.id}`}
      className={note.path === currentPath ? "note_row active" : "note_row"}
      onClick={onClick}
    >
      {note.title}
      {note.is_private && " private "}
      {isEditable && (
        <TreeAction
          label="delete note"
          icon="🗑️"
          onClick={(event) => {
            event.stopPropagation()
            handleDelete()
          }}
        />
      )}
    </div>
  )
}
