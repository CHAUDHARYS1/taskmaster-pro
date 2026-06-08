import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Eye, EyeSlash } from '@phosphor-icons/react'
import Spinner from '../ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import LogoLockup from '../ui/LogoLockup'

const FEATURES = [
  'Kanban, List, Calendar & Gantt views',
  'Real-time collaboration with your team',
  'Projects, labels, priorities & reminders',
  'Recurring tasks & smart automation',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function pwStrength(pwd) {
  if (!pwd) return null
  let s = 0
  if (pwd.length >= 8)  s++
  if (pwd.length >= 12) s++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++
  if (/\d/.test(pwd))           s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  if (s <= 1) return { label: 'Weak',   color: '#ef4444', pct: 33  }
  if (s <= 3) return { label: 'Fair',   color: '#f59e0b', pct: 66  }
  return               { label: 'Strong', color: '#22c55e', pct: 100 }
}

export default function AuthPage() {
  const [mode,         setMode]         = useState('login')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [fieldErrors,  setFieldErrors]  = useState({})
  const [serverError,  setServerError]  = useState('')
  const [success,      setSuccess]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const isTimeout  = searchParams.get('reason') === 'timeout'

  // ── Validation ─────────────────────────────────────────────
  const getError = (field, currentMode = mode) => {
    switch (field) {
      case 'firstName':
        if (currentMode !== 'signup') return ''
        if (!firstName.trim())          return 'First name is required.'
        if (firstName.trim().length < 2) return 'At least 2 characters required.'
        return ''
      case 'email':
        if (!email.trim())               return 'Email is required.'
        if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.'
        return ''
      case 'password':
        if (!password)                                          return 'Password is required.'
        if (currentMode === 'signup' && password.length < 8)   return 'Must be at least 8 characters.'
        return ''
      default: return ''
    }
  }

  const validateAll = (currentMode = mode) => {
    const fields = currentMode === 'signup'
      ? ['firstName', 'email', 'password']
      : ['email', 'password']
    const errs = {}
    fields.forEach(f => { const e = getError(f, currentMode); if (e) errs[f] = e })
    return errs
  }

  const handleBlur = (field) => {
    const err = getError(field)
    setFieldErrors(prev => ({ ...prev, [field]: err }))
  }

  const clearError = (field) => {
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ── Mode switch ─────────────────────────────────────────────
  const switchMode = (next) => {
    setMode(next)
    setFieldErrors({})
    setServerError('')
    setSuccess('')
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccess('')

    const errs = validateAll()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        await new Promise(r => setTimeout(r, 700))
        navigate(redirectTo || '/app', { replace: true })
      } else {
        const { error } = await signUp(email, password, firstName.trim(), lastName.trim())
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
      }
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const strength = mode === 'signup' ? pwStrength(password) : null

  return (
    <div className="auth-split">

      {/* ── Left: marketing panel ───────────────────────────── */}
      <aside className="auth-left" aria-label="Product highlights">
        <div className="auth-left-inner">
          <LogoLockup width={152} white className="auth-left-logo" />

          <div className="auth-left-body">
            <h1 className="auth-left-headline">
              Organize your work,<br />your way.
            </h1>
            <ul className="auth-features" aria-label="Features">
              {FEATURES.map(f => (
                <li key={f} className="auth-feature-item">
                  <CheckCircle size={16} weight="fill" className="auth-feature-icon" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-left-tagline">Built for focus. Designed for teams.</p>
        </div>
      </aside>

      {/* ── Right: form panel ───────────────────────────────── */}
      <main className="auth-right">
        <Link to="/" className="auth-back" aria-label="Back to home page">
          <ArrowLeft size={14} weight="bold" aria-hidden="true" />
          Back to home
        </Link>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login' ? 'Sign in to your account' : 'Get started for free'}
            </p>
          </div>

          {isTimeout && (
            <div className="auth-timeout-banner" role="alert">
              Session timed out — you were away for more than 3 hours. Please sign back in to continue.
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Name row — signup only */}
            {mode === 'signup' && (
              <div className="auth-name-row">
                <div className={`field-block${fieldErrors.firstName ? ' field-block--error' : ''}`}>
                  <label htmlFor="first-name">First name</label>
                  <input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); clearError('firstName') }}
                    onBlur={() => handleBlur('firstName')}
                    placeholder="Jane…"
                    autoComplete="given-name"
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? 'err-firstName' : undefined}
                  />
                  {fieldErrors.firstName && (
                    <span id="err-firstName" className="field-error" role="alert">
                      {fieldErrors.firstName}
                    </span>
                  )}
                </div>
                <div className="field-block">
                  <label htmlFor="last-name">Last name <span className="field-optional">(optional)</span></label>
                  <input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Smith…"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className={`field-block${fieldErrors.email ? ' field-block--error' : ''}`}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email') }}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'err-email' : undefined}
              />
              {fieldErrors.email && (
                <span id="err-email" className="field-error" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={`field-block${fieldErrors.password ? ' field-block--error' : ''}`}>
              <label htmlFor="password">Password</label>
              <div className="field-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError('password') }}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    [fieldErrors.password && 'err-password', mode === 'signup' && 'pw-hint']
                      .filter(Boolean).join(' ') || undefined
                  }
                />
                <button
                  type="button"
                  className="field-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeSlash size={14} aria-hidden="true" />
                    : <Eye      size={14} aria-hidden="true" />}
                </button>
              </div>

              {fieldErrors.password && (
                <span id="err-password" className="field-error" role="alert">
                  {fieldErrors.password}
                </span>
              )}

              {/* Strength meter — signup only */}
              {mode === 'signup' && password && strength && (
                <div className="pw-strength" aria-live="polite">
                  <div className="pw-strength-track">
                    <div
                      className="pw-strength-fill"
                      style={{ width: `${strength.pct}%`, background: strength.color }}
                    />
                  </div>
                  <span className="pw-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {mode === 'signup' && !password && (
                <span id="pw-hint" className="field-hint">Min. 8 characters.</span>
              )}
            </div>

            {serverError && <p className="form-error" role="alert">{serverError}</p>}
            {success     && <p className="form-success" role="status">{success}</p>}

            <button type="submit" className="btn-primary btn-block" disabled={loading}>
              {loading
                ? <><Spinner size={14} />{mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>

    </div>
  )
}
