import { useEffect, useState } from "react"
import FolderTree from "./FolderTree"
import NavigationBar from "./NavigationBar"
import { Note, Graph } from "../../schemas/types"
import MarkdownViewer from "./MarkdownViewer"
import { useParams } from "react-router"
import { getGraph, getUser } from "../api"

export default function () {
  const { name } = useParams()
  const [links, setLinks] = useState<Graph>()
  const [currentNote, setCurrentNote] = useState<Note>()
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        if (!name) return
        const user = await getUser({ name })
        setLinks(await getGraph(user.id))
        setError("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "couldn't load graph")
      }
    })()
  }, [name, currentNote])

  return (
    <div>
      <NavigationBar />
      {error && <div> {error} </div>}
      <FolderTree setCurrentNote={setCurrentNote} />
      {currentNote ? (
        <MarkdownViewer
          serverNote={currentNote}
          setServerNote={setCurrentNote}
        />
      ) : (
        <>{JSON.stringify(links)}</>
      )}
    </div>
  )
}
