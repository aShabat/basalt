import { useEffect, useState } from "react"
import FolderTree from "./FolderTree"
import NavigationBar from "./NavigationBar"
import { Note, Graph } from "../../schemas/types"
import MarkdownViewer from "./MarkdownViewer"
import { useParams } from "react-router"
import { getGraph } from "../api"

export default function () {
  const { name } = useParams()
  const [links, setLinks] = useState<Graph>()
  const [currentNote, setCurrentNote] = useState<Note>()

  useEffect(() => {
    ;(async () => {
      setLinks(await getGraph({ name }))
    })()
  }, [name, currentNote])

  return (
    <div>
      <NavigationBar />
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
