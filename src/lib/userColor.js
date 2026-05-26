const COLORS = ['#2563EB', '#15803d', '#7c3aed', '#c2410c', '#be185d', '#0f766e']

export function userColor(userId) {
  let hash = 0
  for (const ch of String(userId)) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}
