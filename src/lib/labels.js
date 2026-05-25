export const LABELS = [
  { id: 'bug',     name: 'Bug',     color: '#b91c1c', bg: 'rgba(185,28,28,0.12)' },
  { id: 'feature', name: 'Feature', color: '#2563EB', bg: 'rgba(37,99,235,0.12)'  },
  { id: 'design',  name: 'Design',  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  { id: 'docs',    name: 'Docs',    color: '#0f766e', bg: 'rgba(15,118,110,0.12)' },
  { id: 'test',    name: 'Test',    color: '#15803d', bg: 'rgba(21,128,61,0.12)'  },
  { id: 'chore',   name: 'Chore',   color: '#555555', bg: 'rgba(85,85,85,0.10)'   },
  { id: 'urgent',  name: 'Urgent',  color: '#c2410c', bg: 'rgba(194,65,12,0.12)'  },
]

export const labelMap = Object.fromEntries(LABELS.map(l => [l.id, l]))
