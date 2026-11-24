import { Note } from "../../schemas/types"
import DOMPurify from "dompurify"
import { marked } from "marked"
import { useAppSelector } from "../store/store"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { updateNote } from "../api"

interface Props {
  serverNote: Note
  setServerNote: Function
}
export default function ({ serverNote, setServerNote }: Props) {
  const user = useAppSelector(({ auth }) => auth.user)
  const isEditable = user?.id === serverNote.user_id
  const [clientNote, setClientNote] = useState(serverNote.content)
  const [editFlag, setEditFlag] = useState(false)
  const [error, setError] = useState("")
  const [privacyPending, setPrivacyPending] = useState(false)

  async function handleSave() {
    setError("")
    try {
      const updatedNote = await updateNote(
        serverNote.id,
        undefined,
        undefined,
        undefined,
        clientNote,
      )

      if (updatedNote) setServerNote(updatedNote)
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
        undefined,
        undefined,
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

  return (
    <div>
      {error && <div> {error} </div>}
      {isEditable && (
        <>
          <button onClick={() => setEditFlag(!editFlag)}> edit </button>
          <label>
            <input
              type="checkbox"
              checked={serverNote.is_private}
              onChange={handlePrivateChange}
              disabled={privacyPending}
            />
            private
          </label>
        </>
      )}
      {isEditable && editFlag && (
        <>
          <button onClick={handleSave}> save </button>
          <Editor
            serverNote={serverNote.content}
            onChange={(content: string) => setClientNote(content)}
          />
        </>
      )}
      <Markdown content={clientNote} />
    </div>
  )
}

interface EditorProps {
  serverNote: string
  onChange: Function
}
export function Editor({ serverNote, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = serverNote || ""
  }, [serverNote])

  function handleChange() {
    onChange(editorRef.current?.innerText)
  }

  return (
    <div id="editor" ref={editorRef} contentEditable onInput={handleChange} />
  )
}

interface MarkdownProps {
  content: string
}
export function Markdown({ content }: MarkdownProps) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked.parse(content) as string),
      }}
    />
  )
}
