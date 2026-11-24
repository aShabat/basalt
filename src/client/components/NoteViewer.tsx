import { useEffect, useState } from "react"
import FolderTree from "./FolderTree"
import NavigationBar from "./NavigationBar"
import { Note, Graph } from "../../schemas/types"
import MarkdownViewer from "./MarkdownViewer"
import { useNavigate, useParams } from "react-router"
import { getGraph, getUser } from "../api"
import { useAppSelector } from "../store/store"

export default function () {
  const { name } = useParams()
  const navigate = useNavigate()
  const user = useAppSelector(({ auth }) => auth.user)
  const [links, setLinks] = useState<Graph>()
  const [currentNote, setCurrentNote] = useState<Note>()
  const [error, setError] = useState("")
  const [treeVersion, setTreeVersion] = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        if (!name) return
        const profile = await getUser({ name })
        setLinks(await getGraph(profile.id))
        setError("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't load graph")
      }
    })()
  }, [name, currentNote, user?.id])

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

  return (
    <div>
      <NavigationBar />
      {error && <div> {error} </div>}
      <FolderTree setCurrentNote={setCurrentNote} refreshKey={treeVersion} />
      {currentNote ? (
        <MarkdownViewer
          serverNote={currentNote}
          setServerNote={handleNoteChange}
        />
      ) : (
        <>{JSON.stringify(links)}</>
      )}
    </div>
  )
}
