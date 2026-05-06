export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(today())
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
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

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export const CATEGORIES = ['Teaching', 'Meeting', 'Follow-up', 'Admin', 'Event', 'Media', 'Finance', 'Prayer', 'Other']
export const PRIORITIES = ['High', 'Medium', 'Low']
export const TASK_STATUSES = ['Not started', 'In progress', 'Done']
export const FOLLOW_UP_STATUSES = ['Active', 'Watching', 'No action needed']
export const LEADER_FOLLOW_UP_STATUSES = ['Active', 'Needs check-in', 'Watching', 'No action needed']
export const MEMBER_ISSUE_STATUSES = ['No issue', 'Needs call', 'Escalated', 'Resolved']
export const PREP_STATUSES = ['Not started', 'Gathering thoughts', 'In preparation', 'Ready', 'Taught', 'Needs follow-up']
export const PROJECT_STATUSES = ['Planning', 'Active', 'On hold', 'Complete']
export const GOAL_CATEGORIES = ['Vision', 'Discipleship', 'Events', 'Teaching', 'Leadership', 'Media', 'Other']
export const GOAL_STATUSES = ['Active', 'On hold', 'Completed']
export const SUGGESTION_TYPES = ['Task', 'Reminder', 'Meeting', 'WhatsApp Message', 'Goal', 'Teaching Preparation']
export const SUGGESTION_STATUSES = ['pending', 'accepted', 'dismissed', 'completed']
export const MEETING_TYPES = [
  'Leadership Huddle',
  'One-on-One',
  'Planning Meeting',
  'Discipleship Meeting',
  'Event Meeting',
  'Other',
]

export function prepStatusColor(status) {
  const map = {
    'Not started': '#9b9189',
    'Gathering thoughts': '#f97316',
    'In preparation': '#5a9fd4',
    'Ready': '#22a355',
    'Taught': '#8b5cf6',
    'Needs follow-up': '#ef5350',
  }
  return map[status] || '#9b9189'
}

export function memberIssueColor(status) {
  const map = {
    'No issue': '#9b9189',
    'Needs call': '#ffa726',
    'Escalated': '#ef5350',
    'Resolved': '#22a355',
  }
  return map[status] || '#9b9189'
}

export function goalStatusColor(status) {
  const map = {
    'Active': '#22a355',
    'On hold': '#ffa726',
    'Completed': '#5a9fd4',
  }
  return map[status] || '#9b9189'
}

export function leaderStatusColor(status) {
  const map = {
    'Active': '#22a355',
    'Needs check-in': '#ffa726',
    'Watching': '#5a9fd4',
    'No action needed': '#9b9189',
  }
  return map[status] || '#9b9189'
}
