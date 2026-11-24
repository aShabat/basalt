import { useEffect, useState } from "react"
import FolderTree from "./FolderTree"
import NavigationBar from "./NavigationBar"
import { Note } from "../../schemas/types"
import MarkdownViewer from "./MarkdownViewer"
import GraphView from "./GraphView"
import { useLocation, useNavigate, useParams } from "react-router"
import { deleteNote } from "../api"
import { useAppSelector } from "../store/store"
import { decodePath, encodePath } from "../paths"

export default function () {
  const { name } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppSelector(({ auth }) => auth.user)
  const [currentNote, setCurrentNote] = useState<Note>()
  const [treeVersion, setTreeVersion] = useState(0)
  const [showGraph, setShowGraph] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function handleSelectNote(note: Note) {
    setShowGraph(false)
    setCurrentNote(note)
  }

  useEffect(() => {
    if (!currentNote?.is_private) return
    if (currentNote.user_id === user?.id) return
    setCurrentNote(undefined)
    navigate(name ? `/${name}` : "/")
  }, [currentNote, user?.id, name, navigate])

  function handleNoteChange(note: Note) {
    setCurrentNote(note)
    setTreeVersion((version) => version + 1)
  }

  function handlePathsChanged(mapping: { from: string; to: string }[]) {
    const current = currentNote?.path ?? decodePath(location.pathname)
    const change = mapping.find((item) => item.from === current)
    if (change) navigate(encodePath(change.to), { replace: true })
  }

  async function handleDeleteNote() {
    if (!currentNote) return
    await deleteNote(currentNote.user_id, currentNote.id)
    setCurrentNote(undefined)
    setTreeVersion((version) => version + 1)
    navigate(name ? `/${name}` : "/")
  }

  return (
    <div className="app_shell">
      <NavigationBar />
      <div className={sidebarOpen ? "app_body" : "app_body sidebar_closed"}>
        {sidebarOpen && (
          <aside className="sidebar">
            <div className="sidebar_header">
              <button
                type="button"
                className="sidebar_toggle"
                onClick={() => setSidebarOpen(false)}
                aria-label="hide tree"
                title="hide tree"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? "notes" : "graph"}
              </button>
            </div>
            <FolderTree
              setCurrentNote={handleSelectNote}
              refreshKey={treeVersion}
              onPathsChanged={handlePathsChanged}
            />
          </aside>
        )}
        <main className="main_pane">
          {!sidebarOpen && (
            <button
              type="button"
              className="sidebar_toggle sidebar_open"
              onClick={() => setSidebarOpen(true)}
              aria-label="show tree"
              title="show tree"
            >
              ▶
            </button>
          )}
          {showGraph && name ? (
            <GraphView name={name} onOpen={() => setShowGraph(false)} />
          ) : currentNote ? (
            <MarkdownViewer
              key={`${currentNote.id}:${currentNote.path}`}
              serverNote={currentNote}
              setServerNote={handleNoteChange}
              onDelete={handleDeleteNote}
            />
          ) : (
            <div className="empty_note">select a note</div>
          )}
        </main>
      </div>
    </div>
  )
}
