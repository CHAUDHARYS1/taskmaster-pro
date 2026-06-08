export default function LogoLockup({ width = 180, className = '', white = false }) {
  const height = Math.round(width * 52 / 300)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 52"
      width={width}
      height={height}
      role="img"
      aria-label="Taskmaster Pro"
      className={className}
    >
      <g transform="translate(0,4)">
        <rect width="44" height="44" rx="11.4" fill="#2563EB" />
        <path
          d="M12.3 22.9 L19.4 29.9 L32.6 15"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="5.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text
        x="58"
        y="34"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', system-ui, Arial, sans-serif"
        fontSize="29"
        fontWeight="700"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        Taskmaster
        <tspan fill={white ? 'rgba(255,255,255,0.75)' : '#2563EB'}> Pro</tspan>
      </text>
    </svg>
  )
}
