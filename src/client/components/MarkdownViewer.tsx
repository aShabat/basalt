import { Note } from "../../schemas/types"
import DOMPurify from "dompurify"
import { marked } from "marked"
import { useAppSelector } from "../store/store"
import { useEffect, useRef, useState } from "react"
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

  async function handleSave() {
    const updatedNote = await updateNote(
      user!.id,
      serverNote.id,
      undefined,
      undefined,
      clientNote,
    )

    if (updatedNote) setServerNote(updatedNote)
  }

  return (
    <div>
      {isEditable && (
        <>
          <button onClick={() => setEditFlag(!editFlag)}> edit </button>
        </>
      )}
      {editFlag && (
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
