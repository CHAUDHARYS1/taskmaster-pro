import { Question } from '@phosphor-icons/react'

export default function PageHint({ text }) {
  return (
    <div className="page-hint" tabIndex={0} aria-label={`About this page: ${text}`}>
      <Question size={14} weight="regular" aria-hidden="true" />
      <div className="page-hint-tip" role="tooltip">{text}</div>
    </div>
  )
}
