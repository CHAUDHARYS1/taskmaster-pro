export default function Spinner({ size = 14, className = '' }) {
  return (
    <svg
      className={`tm-spinner${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path d="M8 2 A6 6 0 0 1 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
