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

export function generateCheckInQuestions(context) {
  const questions = []

  // Parse ministry context XML to extract data
  const leaderMatches = [...context.matchAll(/<leader\s+name="([^"]+)"[^>]*days_since="([^"]+)"[^>]*>/g)]
  const teachingMatches = [...context.matchAll(/<teaching\s+title="([^"]+)"[^>]*date="([^"]+)"[^>]*prep="([^"]+)"[^>]*days_until="([^"]+)"/g)]
  const taskCountMatch = context.match(/<overdue_tasks[^>]*count="(\d+)">/)

  // 1. CRITICAL: Overdue leaders (>14 days)
  if (leaderMatches.length > 0) {
    const overdueLeaders = leaderMatches.filter(m => {
      const daysSince = parseInt(m[2])
      return daysSince > 14
    })

    if (overdueLeaders.length > 0) {
      const leader = overdueLeaders[0]
      const days = Math.floor(parseInt(leader[2]))
      questions.push({
        text: `Have you been able to follow up with ${leader[1]}? I see it's been ${days} days since you last connected.`,
        priority: 'critical',
        type: 'leader_overdue'
      })
    }
  }

  // 2. CRITICAL: Unprepared teachings coming up soon (next 7 days)
  const unpreparedSoon = teachingMatches.filter(m => {
    const prep = m[3]
    const daysUntil = parseInt(m[4])
    return prep !== 'Ready' && prep !== 'Taught' && daysUntil <= 7 && daysUntil > 0
  })

  if (unpreparedSoon.length > 0) {
    const teaching = unpreparedSoon[0]
    const days = Math.ceil(parseInt(teaching[4]))
    questions.push({
      text: `How's your prep coming along for "${teaching[1]}"? You've got ${days} day${days === 1 ? '' : 's'} to get ready.`,
      priority: 'critical',
      type: 'teaching_unprepared'
    })
  }

  // 3. HIGH: Upcoming leaders check-ins (7-14 days overdue)
  if (leaderMatches.length > 0 && questions.length < 2) {
    const checkInDue = leaderMatches.filter(m => {
      const daysSince = parseInt(m[2])
      return daysSince >= 7 && daysSince <= 14
    })

    if (checkInDue.length > 0) {
      const leader = checkInDue[0]
      const days = Math.floor(parseInt(leader[2]))
      questions.push({
        text: `${leader[1]} is coming up for a check-in soon (it's been ${days} days). Want me to help draft a message?`,
        priority: 'high',
        type: 'leader_at_risk'
      })
    }
  }

  // 4. HIGH: Overdue tasks
  if (taskCountMatch && parseInt(taskCountMatch[1]) > 0 && questions.length < 3) {
    const count = parseInt(taskCountMatch[1])
    questions.push({
      text: `You have ${count} overdue task${count === 1 ? '' : 's'} waiting. Should we tackle those today?`,
      priority: 'high',
      type: 'overdue_tasks'
    })
  }

  return questions.slice(0, 3) // Return max 3 questions
}

export function createConversationSummary(messages, daysBack = 7) {
  if (!messages || messages.length === 0) return ''

  const now = new Date()
  const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

  // Find messages older than the cutoff
  const olderMessages = messages.filter(m => {
    const msgDate = new Date(m.ts || m.created_at)
    return msgDate < cutoffDate
  })

  if (olderMessages.length === 0) return ''

  // Extract key topics from older conversations
  const topics = new Set()
  const people = new Set()
  const actions = new Set()

  olderMessages.forEach(msg => {
    const text = msg.content.toLowerCase()

    // Extract mentioned people
    const personMatches = text.match(/(?:theo|you)|(?:with |talking to )\b([a-z]+(?:\s[a-z]+)?)\b/gi)
    if (personMatches) personMatches.forEach(p => people.add(p))

    // Detect topics
    if (/teaching|sermon|bible study|message|prepare|prepa/.test(text)) topics.add('Teaching Preparation')
    if (/leader|team|officer|director|council/.test(text)) topics.add('Leadership')
    if (/meeting|schedule|gather|huddle|discuss/.test(text)) topics.add('Meetings & Planning')
    if (/task|project|action|work|activity/.test(text)) topics.add('Tasks & Projects')
    if (/goal|vision|plan|strategy|long.term/.test(text)) topics.add('Vision & Goals')
    if (/reminder|follow.up|contact|check.in|touchbase/.test(text)) topics.add('Follow-ups & Reminders')
    if (/prayer|spiritual|faith|worship|intercess/.test(text)) topics.add('Spiritual Matters')

    // Detect action decisions
    if (/create task|add reminder|send whatsapp|message/.test(text)) {
      if (/task/.test(text)) actions.add('Task Creation')
      if (/reminder|remind/.test(text)) actions.add('Reminders Set')
      if (/whatsapp|message|text|contact/.test(text)) actions.add('Messages Sent')
    }
  })

  // Build summary text
  let summary = `[PREVIOUS CONVERSATION HISTORY (${daysBack}+ days ago):\n`

  if (topics.size > 0) {
    summary += `Key topics discussed: ${Array.from(topics).slice(0, 3).join(', ')}.\n`
  }

  if (people.size > 0) {
    const uniquePeople = Array.from(people).filter(p => p && p.length > 2).slice(0, 3)
    if (uniquePeople.length > 0) {
      summary += `People mentioned: ${uniquePeople.join(', ')}.\n`
    }
  }

  if (actions.size > 0) {
    summary += `Recent actions: ${Array.from(actions).join(', ')}.\n`
  }

  // Add a note about message count
  summary += `Total ${olderMessages.length} messages in conversation history before this week.\n`
  summary += `Reference these past discussions to maintain continuity and avoid re-asking about already-decided items.]\n`

  return summary
}
