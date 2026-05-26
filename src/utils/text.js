export function stripHtml(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function truncateText(str, max = 300) {
  const s = str.trim()
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}
