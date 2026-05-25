import { useState } from 'react'
import { useMembers } from '../../hooks/useMembers'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

export default function InviteModal({ onClose }) {
  const { currentWorkspace } = useWorkspace()
  const { inviteMember }     = useMembers(currentWorkspace?.id)
  const { toast }            = useToast()

  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const invite = await inviteMember({ email, role, workspaceName: currentWorkspace?.name })
      const link = `${window.location.origin}/invite/${invite.token}`
      setInviteLink(link)
      toast.success(`Invite sent to ${email}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-hdr">
          <h2 className="modal-ttl">Invite to {currentWorkspace?.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!inviteLink ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="field-block">
                <label htmlFor="invite-email">Email address</label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="field-block">
                <label htmlFor="invite-role">Role</label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="field-select"
                >
                  <option value="member">Member — can add, edit and move tasks</option>
                  <option value="viewer">Viewer — read-only access</option>
                </select>
              </div>
              {error && <p className="form-error">{error}</p>}
              <p className="invite-hint">
                An invite email will be sent and a link will be generated as a backup — it expires in 7 days.
              </p>
            </div>
            <div className="modal-ftr">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        ) : (
          <div className="modal-body">
            <p className="invite-success">Invite sent to {email}!</p>
            <p className="invite-hint">
              Didn't arrive? Share this backup link directly — it expires in 7 days.
            </p>
            <div className="invite-link-row">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="invite-link-input"
              />
              <button className="btn-primary" onClick={copyLink}>Copy</button>
            </div>
            <div className="modal-ftr">
              <button className="btn-ghost" onClick={() => { setInviteLink(''); setEmail('') }}>
                Invite another
              </button>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
