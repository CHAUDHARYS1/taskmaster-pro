import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { SquaresFour, NotePencil, CalendarBlank, Archive, Plus, SignOut, Kanban, ChartPieSlice, CaretRight } from '@phosphor-icons/react'
import LogoLockup from '../ui/LogoLockup'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProject } from '../../contexts/ProjectContext'
import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
import { BellButton } from '../notifications/NotificationCenter'

export default function Sidebar({ isOpen, collapsed, onToggleCollapse, viewMode, onViewChange, onProfileClick }) {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const { projects, currentProject, switchProject }       = useProject()
  const { user, signOut, profile, displayName }           = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const onDashboard = location.pathname === '/dashboard'
  const onCalendar  = location.pathname === '/calendar'
  const onWrites    = location.pathname.startsWith('/writes')
  const onArchive   = location.pathname === '/archive'

  const [showCreate,    setShowCreate]    = useState(false)
  const [projectsOpen, setProjectsOpen]  = useState(true)

  useEffect(() => { setProjectsOpen(true) }, [currentWorkspace?.id])

  const navItems = [
    { icon: SquaresFour,   label: 'Dashboard', active: onDashboard, onClick: () => navigate(onDashboard ? '/app' : '/dashboard') },
    { icon: CalendarBlank, label: 'Calendar',  active: onCalendar,  onClick: () => navigate('/calendar') },
    { icon: NotePencil,    label: 'Writes',    active: onWrites,    onClick: () => navigate('/writes') },
  ]

  return (
    <>
      <aside
        className={[
          'sidebar',
          isOpen    ? 'sidebar--open'      : '',
          collapsed ? 'sidebar--collapsed' : '',
        ].filter(Boolean).join(' ')}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo + bell ── */}
        <div className="sidebar-top">
          {/* Expanded: wordmark + bell on the same row */}
          <div className="sidebar-logo-full">
            <LogoLockup width={148} className="sidebar-lockup" />
            <BellButton />
          </div>
          {/* Collapsed: mark icon */}
          <div className="sidebar-logo-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52" width="30" height="33">
              <g transform="translate(2,4)">
                <rect width="44" height="44" rx="11.4" fill="#2563EB" />
                <path d="M12.3 22.9 L19.4 29.9 L32.6 15" fill="none" stroke="#FFFFFF" strokeWidth="5.3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
          {/* Collapsed: bell below the mark */}
          <div className="sidebar-logo-bell-collapsed">
            <BellButton />
          </div>
        </div>

        {/* ── Mobile workspace list ── */}
        <div className="sidebar-mobile-ws">
          <span className="sidebar-mobile-ws-label">Workspaces</span>
          {workspaces.map(ws => {
            const isPersonal = ws.id === user?.id
            const isActive   = currentWorkspace?.id === ws.id
            const name       = isPersonal ? 'My Workspace' : ws.name
            return (
              <div key={ws.id} className="sidebar-mobile-ws-group">
                <button
                  className={`sidebar-mobile-ws-row${isActive ? ' sidebar-mobile-ws-row--active' : ''}`}
                  onClick={() => { switchWorkspace(ws); navigate('/app') }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="sidebar-mobile-ws-avatar" style={{ background: ws.color ?? '#2563EB' }}>
                    {ws.emoji || ws.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="sidebar-mobile-ws-name">{name}</span>
                </button>

                {isActive && projects.length > 0 && (
                  <div className="sidebar-mobile-projects">
                    <button
                      className={`sidebar-mobile-project-row${!currentProject ? ' sidebar-mobile-project-row--active' : ''}`}
                      onClick={() => { switchProject(null); navigate('/app') }}
                    >
                      <span className="sidebar-mobile-project-dot sidebar-mobile-project-dot--all" />
                      <span className="sidebar-mobile-project-name">All Projects</span>
                    </button>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        className={`sidebar-mobile-project-row${currentProject?.id === p.id ? ' sidebar-mobile-project-row--active' : ''}`}
                        onClick={() => { switchProject(p); navigate('/app') }}
                      >
                        <span className="sidebar-mobile-project-dot" style={{ background: p.color }} />
                        <span className="sidebar-mobile-project-name">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ icon: Icon, label, active, onClick }) => (
            <button
              key={label}
              className={`sidebar-dash-btn${active ? ' sidebar-dash-btn--active' : ''}`}
              onClick={onClick}
              aria-pressed={active}
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="sidebar-dash-icon" aria-hidden="true" />
              <span className="sidebar-nav-label">{label}</span>
            </button>
          ))}

          {/* ── Expanded: full workspace switcher ── */}
          <div className="sidebar-ws-section">
            <WorkspaceSwitcher
              projectsOpen={projectsOpen}
              onToggleProjects={() => setProjectsOpen(p => !p)}
              viewMode={viewMode}
              onViewChange={onViewChange}
            />
          </div>

          {/* ── Collapsed: compact workspace + project list ── */}
          <div className="sidebar-ws-compact" aria-label="Workspaces">
            {workspaces.map(ws => {
              const isPersonal = ws.id === user?.id
              const isActiveWs = currentWorkspace?.id === ws.id
              return (
                <div key={ws.id} className="sidebar-ws-compact-group">
                  {/* Workspace avatar */}
                  <button
                    className={`sidebar-ws-compact-btn${isActiveWs ? ' sidebar-ws-compact-btn--active' : ''}`}
                    onClick={() => {
                      switchWorkspace(ws)
                      if (!isActiveWs) navigate('/app')
                    }}
                    title={isPersonal ? 'My Workspace' : ws.name}
                    aria-label={isPersonal ? 'My Workspace' : ws.name}
                  >
                    <span
                      className="ws-avatar sidebar-ws-compact-avatar"
                      style={{ background: ws.color ?? '#2563EB' }}
                    >
                      {ws.emoji || ws.name.charAt(0).toUpperCase()}
                    </span>
                  </button>

                  {/* Projects for active workspace */}
                  {isActiveWs && (
                    <div className="sidebar-projects-compact">
                      {/* All Projects */}
                      <button
                        className={`sidebar-project-compact-btn${!currentProject ? ' sidebar-project-compact-btn--active' : ''}`}
                        onClick={() => { switchProject(null); navigate('/app') }}
                        title="All Projects"
                        aria-label="All Projects"
                      >
                        <SquaresFour size={12} aria-hidden="true" />
                      </button>

                      {/* Individual projects */}
                      {projects.map(p => (
                        <button
                          key={p.id}
                          className={`sidebar-project-compact-btn${currentProject?.id === p.id ? ' sidebar-project-compact-btn--active' : ''}`}
                          onClick={() => { switchProject(p); navigate('/app') }}
                          title={p.name}
                          aria-label={p.name}
                        >
                          <span
                            className="sidebar-project-compact-dot"
                            style={{ background: p.color }}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* ── New workspace ── */}
        <button
          className="btn-ghost ws-new-btn sidebar-new-ws-btn"
          onClick={() => setShowCreate(true)}
          aria-label="New workspace"
          title={collapsed ? 'New workspace' : undefined}
        >
          <Plus size={14} weight="bold" className="sidebar-new-ws-icon" aria-hidden="true" />
          <span className="sidebar-nav-label">New workspace</span>
        </button>

        {/* ── Footer ── */}
        <div className="sidebar-footer sidebar-footer--collapsible">

          {/* Profile · Archive · Sign out */}
          <div className="sidebar-footer-row">
            {onProfileClick ? (
              <button
                className="sidebar-profile-btn"
                onClick={() => window.innerWidth <= 768 ? navigate('/profile') : onProfileClick()}
                aria-label={`Settings for ${displayName || user?.email}`}
                title={collapsed ? (displayName || user?.email) : undefined}
              >
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="sidebar-profile-avatar sidebar-profile-avatar--photo" />
                  : <span className="sidebar-profile-avatar" style={{ background: userColor(user?.id) }} aria-hidden="true">
                      {(displayName || user?.email || '?')[0].toUpperCase()}
                    </span>
                }
                <span className="sidebar-profile-name sidebar-nav-label">{profile?.first_name || user?.email}</span>
                <CaretRight size={13} weight="bold" className="sidebar-profile-caret sidebar-nav-label" aria-hidden="true" />
              </button>
            ) : (
              <div
                className="sidebar-profile-btn sidebar-profile-btn--static"
                aria-label={`Signed in as ${displayName || user?.email}`}
              >
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="sidebar-profile-avatar sidebar-profile-avatar--photo" />
                  : <span className="sidebar-profile-avatar" style={{ background: userColor(user?.id) }} aria-hidden="true">
                      {(displayName || user?.email || '?')[0].toUpperCase()}
                    </span>
                }
                <span className="sidebar-profile-name sidebar-nav-label">{profile?.first_name || user?.email}</span>
              </div>
            )}
            <button
              className={`sidebar-archive-btn${onArchive ? ' sidebar-archive-btn--active' : ''}`}
              onClick={() => navigate('/archive')}
              aria-label="Archive"
              title="Archive"
            >
              <Archive size={18} aria-hidden="true" />
            </button>
            <button
              className="sidebar-signout-btn"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <SignOut size={18} aria-hidden="true" />
              <span className="sidebar-nav-label">Sign out</span>
            </button>
          </div>

          <Link to="/release-notes" className="sidebar-version sidebar-version-link">v1.2.00</Link>
          <p className="sidebar-credit">
            Designed and built by{' '}
            <a href="https://scdesigns.netlify.app/" target="_blank" rel="noreferrer" className="sidebar-credit-link">
              SC Design and Consultation
            </a>
          </p>
        </div>

        {/* ── Collapse edge handle (desktop only) ── */}
        {onToggleCollapse && (
          <button
            className="sidebar-edge-handle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        )}
      </aside>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}

      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        <button
          className={`mobile-nav-btn${onDashboard ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => navigate('/dashboard')}
          aria-label="Dashboard"
        >
          <ChartPieSlice size={22} aria-hidden="true" />
          <span>Dashboard</span>
        </button>
        <button
          className={`mobile-nav-btn${location.pathname === '/app' || location.pathname.startsWith('/workspace/') ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => navigate('/app')}
          aria-label="Board"
        >
          <Kanban size={22} aria-hidden="true" />
          <span>Board</span>
        </button>
        <button
          className={`mobile-nav-btn${onCalendar ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => navigate('/calendar')}
          aria-label="Calendar"
        >
          <CalendarBlank size={22} aria-hidden="true" />
          <span>Calendar</span>
        </button>
        <button
          className={`mobile-nav-btn${onWrites ? ' mobile-nav-btn--active' : ''}`}
          onClick={() => navigate('/writes')}
          aria-label="Writes"
        >
          <NotePencil size={22} aria-hidden="true" />
          <span>Writes</span>
        </button>
      </nav>
    </>
  )
}
