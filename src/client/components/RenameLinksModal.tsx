import { RenamePreview } from "../../schemas/api"

interface Props {
  preview: RenamePreview
  pending: boolean
  error: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ({
  preview,
  pending,
  error,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="modal_backdrop">
      <div className="modal">
        <h3>Update links?</h3>
        <p>
          {preview.old_path} becomes {preview.new_path}
        </p>
        <p>
          {preview.link_count} links in {preview.notes.length} notes will be
          updated.
        </p>
        {preview.cross_user_count > 0 && (
          <p>
            This includes notes owned by {preview.cross_user_count} other
            users.
          </p>
        )}
        <ul>
          {preview.notes.map((note) => (
            <li key={note.id}>
              {note.owner}: {note.title} ({note.path}) - {note.count} links
            </li>
          ))}
        </ul>
        {error && <div className="error"> {error} </div>}
        <div className="modal_actions">
          <button type="button" onClick={onCancel} disabled={pending}>
            cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending}>
            {pending ? "updating..." : "update links"}
          </button>
        </div>
      </div>
    </div>
  )
}
