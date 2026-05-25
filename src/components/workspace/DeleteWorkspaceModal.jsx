import { useMemo, useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

const WORDS = [
  'avalanche','biscuit','chimney','driftwood','eclipse','falcon',
  'glacier','harbor','ignite','jungle','keystone','lantern',
  'marble','nautical','obsidian','phantom','quicksand','ridgeline',
  'solstice','tundra','umbra','vortex','whisper','zenith',
]

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export default function DeleteWorkspaceModal({ workspace, onClose }) {
  const { deleteWorkspace } = useWorkspace()
  const { toast } = useToast()

  const confirmWord = useMemo(() => randomWord(), [])
  const [typed, setTyped]     = useState('')
  const [deleting, setDeleting] = useState(false)

  const isPersonal = workspace.id === workspace.owner_id
  const matches    = typed === confirmWord

  const handleDelete = async () => {
    if (!matches || deleting) return
    setDeleting(true)
    try {
      await deleteWorkspace(workspace.id)
      toast.success(`"${workspace.name}" deleted`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace')
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet delete-ws-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Delete workspace"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl delete-ws-title">Delete workspace</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {isPersonal ? (
            <p className="delete-ws-warning">
              Your personal workspace cannot be deleted.
            </p>
          ) : (
            <>
              <p className="delete-ws-warning">
                This will permanently delete <strong>{workspace.name}</strong> and all its
                tasks, labels, comments, and members. This action <strong>cannot be undone</strong>.
              </p>

              <p className="delete-ws-instruction">
                To confirm, type the following word below:
              </p>

              <div className="delete-ws-confirm-word" aria-label={`Type: ${confirmWord}`}>
                {confirmWord}
              </div>

              <input
                type="text"
                className="delete-ws-input"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={`Type "${confirmWord}" to confirm`}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </>
          )}
        </div>

        <div className="modal-ftr">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          {!isPersonal && (
            <button
              className="btn-danger"
              disabled={!matches || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Delete workspace'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
