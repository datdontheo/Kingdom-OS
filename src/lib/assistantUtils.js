export function detectActionTriggers(text) {
  const lower = text.toLowerCase()
  const triggers = []

  if (/remind me|don'?t forget|set a reminder|remember to/.test(lower)) {
    triggers.push('reminder')
  }
  if (/message|text|whatsapp|send|reach out to|contact|call/.test(lower)) {
    triggers.push('whatsapp')
  }
  if (/create (a )?task|add (a )?task|i need to|we (have|need) to|follow up with|check on|assign/.test(lower)) {
    triggers.push('task')
  }
  if (/i'?m teaching|teaching on|sermon|bible study|outline|message notes|help me prepare|preparing a teaching|preparing to teach/.test(lower)) {
    triggers.push('teaching_prep')
  }
  if (/goal|vision|long.?term|plan to|want to achieve|aim to|working towards/.test(lower)) {
    triggers.push('goal')
  }
  if (/meeting|let'?s plan|schedule (a )?meeting|can we meet|set up a meeting/.test(lower)) {
    triggers.push('meeting')
  }

  return [...new Set(triggers)]
}

export function buildTriggerHint(triggers) {
  if (!triggers.length) return ''
  return `\n\n[INTENT DETECTED: The user likely wants to: ${triggers.join(', ')}. Generate ACTION blocks for these intents where relevant.]`
}

export function mapActionTypeToSuggestionType(actionType) {
  const map = {
    send_whatsapp: 'WhatsApp Message',
    create_task: 'Task',
    set_reminder: 'Reminder',
    teaching_prep: 'Teaching Preparation',
    add_goal: 'Goal',
    schedule_meeting: 'Meeting',
  }
  return map[actionType] || 'Task'
}
