import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReminders() {
  useEffect(() => {
    checkDueReminders()
  }, [])
}

async function checkDueReminders() {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('due_at', now)

  if (!data?.length) return

  const granted = await requestNotificationPermission()

  for (const reminder of data) {
    if (granted) {
      new Notification(`Kingdom OS: ${reminder.title}`, {
        body: reminder.body || '',
        icon: '/favicon.svg',
      })
    }
    await supabase.from('reminders').update({ status: 'sent' }).eq('id', reminder.id)
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function scheduleReminder({ title, body, due_at, person_id, whatsapp_number, whatsapp_message }) {
  await requestNotificationPermission()
  const { data, error } = await supabase.from('reminders').insert({
    title, body, due_at, person_id: person_id || null,
    whatsapp_number: whatsapp_number || null,
    whatsapp_message: whatsapp_message || null,
    status: 'pending',
  }).select().single()
  return { data, error }
}
