export const PRIORITIES = [
  { id: 'low',    name: 'Low',    color: '#15803d', icon: '↓' },
  { id: 'medium', name: 'Medium', color: '#d97706', icon: '→' },
  { id: 'high',   name: 'High',   color: '#c2410c', icon: '↑' },
  { id: 'urgent', name: 'Urgent', color: '#b91c1c', icon: '!!' },
]

export const priorityMap = Object.fromEntries(PRIORITIES.map(p => [p.id, p]))
