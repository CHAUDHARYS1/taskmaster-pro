export const PRIORITIES = [
  { id: 'low',    name: 'Low',    color: '#15803d', bg: 'rgba(21,128,61,0.12)',   icon: '↓' },
  { id: 'medium', name: 'Medium', color: '#d97706', bg: 'rgba(217,119,6,0.12)',   icon: '→' },
  { id: 'high',   name: 'High',   color: '#c2410c', bg: 'rgba(194,65,12,0.12)',   icon: '↑' },
  { id: 'urgent', name: 'Urgent', color: '#b91c1c', bg: 'rgba(185,28,28,0.12)',   icon: '!!' },
]

export const priorityMap = Object.fromEntries(PRIORITIES.map(p => [p.id, p]))
