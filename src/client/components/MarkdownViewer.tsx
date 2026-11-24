import { Note } from "../../schemas/types"
import { RenamePreview } from "../../schemas/api"
import DOMPurify from "dompurify"
import { marked } from "marked"
import { useAppSelector } from "../store/store"
import { ChangeEvent, useEffect, useState } from "react"
import {
  previewNoteRename,
  renameNote,
  updateNote,
} from "../api"
import { useNavigate } from "react-router"
import { encodePath } from "../paths"
import { prepareLinks } from "../../markdown"
import RenameLinksModal from "./RenameLinksModal"

interface Props {
  serverNote: Note
  setServerNote: Function
  onDelete: () => Promise<void>
}
export default function ({ serverNote, setServerNote, onDelete }: Props) {
  const user = useAppSelector(({ auth }) => auth.user)
  const navigate = useNavigate()
  const isEditable = user?.id === serverNote.user_id
  const [title, setTitle] = useState(serverNote.title)
  const [clientNote, setClientNote] = useState(serverNote.content)
  const [editFlag, setEditFlag] = useState(false)
  const [error, setError] = useState("")
  const [privacyPending, setPrivacyPending] = useState(false)
  const [renamePreview, setRenamePreview] = useState<RenamePreview>()
  const [renameTitle, setRenameTitle] = useState("")
  const [renamePending, setRenamePending] = useState(false)
  const [renameError, setRenameError] = useState("")

  useEffect(() => {
    setTitle(serverNote.title)
    setClientNote(serverNote.content)
    setEditFlag(false)
    setError("")
    setRenamePreview(undefined)
    setRenameError("")
  }, [serverNote.id])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!editFlag) return
      if (!(event.ctrlKey || event.metaKey) || event.key !== "s") return
      event.preventDefault()
      handleSave()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [editFlag, clientNote, serverNote])

  async function handleSave() {
    setError("")
    try {
      const updatedNote = await updateNote(serverNote.id, clientNote)
      if (updatedNote) {
        setServerNote(updatedNote)
        setClientNote(updatedNote.content)
        setTitle(updatedNote.title)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't save note")
    }
  }

  async function handlePrivateChange(event: ChangeEvent<HTMLInputElement>) {
    setError("")
    setPrivacyPending(true)
    try {
      const updatedNote = await updateNote(
        serverNote.id,
        undefined,
        event.target.checked,
      )
      if (updatedNote) setServerNote(updatedNote)
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't change privacy")
    } finally {
      setPrivacyPending(false)
    }
  }

  async function applyRename(nextTitle: string) {
    setRenameError("")
    setRenamePending(true)
    try {
      const result = await renameNote(serverNote.id, nextTitle)
      setServerNote(result.note)
      setTitle(result.note.title)
      setClientNote(result.note.content)
      setRenamePreview(undefined)
      navigate(encodePath(result.note.path), { replace: true })
    } catch (err) {
      setRenameError(errorMessage(err))
    } finally {
      setRenamePending(false)
    }
  }

  async function handleRename() {
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("title can't be empty")
      return
    }
    if (nextTitle === serverNote.title) return

    setError("")
    setRenameError("")
    setRenameTitle(nextTitle)
    try {
      const preview = await previewNoteRename(serverNote.id, nextTitle)
      if (!preview.notes.length) {
        await applyRename(nextTitle)
        return
      }
      setRenamePreview(preview)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function handleDelete() {
    if (!window.confirm(`delete ${serverNote.title}?`)) return
    setError("")
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't delete note")
    }
  }

  const dirty = clientNote !== serverNote.content

  return (
    <div className="note_pane">
      <div className="note_header">
        {isEditable ? (
          <>
            <input
              className="note_title_input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <button
              type="button"
              onClick={handleRename}
              disabled={title.trim() === serverNote.title}
            >
              <i className="icon ai-tag" aria-hidden="true" />
              rename
            </button>
          </>
        ) : (
          <h1>{serverNote.title}</h1>
        )}
      </div>
      {error && <div className="error"> {error} </div>}
      {isEditable && (
        <div className="toolbar">
          <button type="button" onClick={() => setEditFlag(!editFlag)}>
            <i
              className={`icon ${editFlag ? "ai-eye-open" : "ai-pencil"}`}
              aria-hidden="true"
            />
            {editFlag ? "preview" : "edit"}
          </button>
          <button type="button" onClick={handleSave} disabled={!dirty}>
            <i className="icon ai-save" aria-hidden="true" />
            save
          </button>
          {dirty && <span className="dirty">unsaved</span>}
          <button type="button" onClick={handleDelete}>
            <i className="icon ai-trash-bin" aria-hidden="true" />
            delete
          </button>
          <label className="private_toggle">
            <input
              type="checkbox"
              checked={serverNote.is_private}
              onChange={handlePrivateChange}
              disabled={privacyPending}
            />
            <i
              className={`icon ${
                serverNote.is_private ? "ai-eye-closed" : "ai-eye-open"
              }`}
              aria-hidden="true"
            />
            private
          </label>
        </div>
      )}
      {isEditable && editFlag && (
        <div className="editor_split">
          <textarea
            className="editor"
            value={clientNote}
            onChange={(event) => setClientNote(event.target.value)}
          />
          <div className="preview">
            <Markdown content={clientNote} />
          </div>
        </div>
      )}
      {!editFlag && <Markdown content={clientNote} />}
      {renamePreview && (
        <RenameLinksModal
          preview={renamePreview}
          pending={renamePending}
          error={renameError}
          onCancel={() => {
            setRenamePreview(undefined)
            setTitle(serverNote.title)
            setRenameError("")
          }}
          onConfirm={() => applyRename(renameTitle)}
        />
      )}
    </div>
  )
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "request failed"
}

interface MarkdownProps {
  content: string
}
export function Markdown({ content }: MarkdownProps) {
  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked.parse(prepareLinks(content)) as string),
      }}
    />
  )
}
