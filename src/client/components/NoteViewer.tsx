import { useState } from "react"
import FolderTree from "./FolderTree"
import NavigationBar from "./NavigationBar"
import { Note } from "../../schemas/types"
import MarkdownViewer from "./MarkdownViewer"

export default function () {
  const [currentNote, setCurrentNote] = useState<Note>()
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
        "graph"
      )}
    </div>
  )
}
