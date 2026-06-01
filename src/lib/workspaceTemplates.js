export const WORKSPACE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'A clean board. Customize it however you like.',
    columnLabels: null,
    columnColors: null,
    defaultLabels: [],
  },
  {
    id: 'job-tracker',
    name: 'Job Application Tracker',
    description: 'Track every application — from saved listings to closed offers.',
    columnLabels: { toDo: 'Saved', inProgress: 'Applied', inReview: 'In Progress', done: 'Closed' },
    columnColors: { toDo: '#6366f1', inProgress: '#0ea5e9', inReview: '#d97706', done: '#555555' },
    defaultLabels: [
      { name: 'Remote',    color: '#2563EB' },
      { name: 'Hybrid',    color: '#7c3aed' },
      { name: 'Onsite',    color: '#15803d' },
      { name: 'Full-time', color: '#0f766e' },
      { name: 'Contract',  color: '#d97706' },
      { name: 'Part-time', color: '#555555' },
    ],
  },
  {
    id: 'freelance',
    name: 'Freelance Project Tracker',
    description: 'Manage clients from first contact to final invoice.',
    columnLabels: { toDo: 'Prospect', inProgress: 'Proposal Sent', inReview: 'In Progress', done: 'Invoiced' },
    columnColors: { toDo: '#6366f1', inProgress: '#0ea5e9', inReview: '#d97706', done: '#22c55e' },
    defaultLabels: [
      { name: 'Design',      color: '#7c3aed' },
      { name: 'Development', color: '#2563EB' },
      { name: 'Content',     color: '#0f766e' },
      { name: 'Retainer',    color: '#15803d' },
      { name: 'Consulting',  color: '#d97706' },
    ],
  },
]
