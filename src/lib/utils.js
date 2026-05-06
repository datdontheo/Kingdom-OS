export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(today())
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function inNext7Days(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const week = new Date()
  week.setDate(week.getDate() + 7)
  return d >= now && d <= week
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / 86400000)
}

export const CATEGORIES = ['Teaching', 'Admin', 'People', 'Vision', 'Events', 'Finance', 'Media']
export const PRIORITIES = ['High', 'Medium', 'Low']
export const TASK_STATUSES = ['Not started', 'In progress', 'Done']
export const FOLLOW_UP_STATUSES = ['Active', 'Watching', 'No action needed']
export const PREP_STATUSES = ['Not started', 'In preparation', 'Ready']
export const PROJECT_STATUSES = ['Planning', 'Active', 'On hold', 'Complete']
export const MEETING_TYPES = [
  'Leadership Huddle',
  'Bi-Monthly Strategic Meeting',
  'Quarterly Vision Review',
  'One-on-One',
  'Other',
]
