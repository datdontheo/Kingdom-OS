import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReminders() {
  useEffect(() => {
    checkDueReminders()
    const interval = setInterval(checkDueReminders, 30000)
    return () => clearInterval(interval)
  }, [])
}

async function checkDueReminders() {
  try {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('done', false)
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
  } catch (err) {
    console.error('Error checking reminders:', err)
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch (err) {
    console.error('Error requesting notification permission:', err)
    return false
  }
}

export async function scheduleReminder({ title, body, due_at, person, whatsapp_message }) {
  await requestNotificationPermission()
  const { data, error } = await supabase.from('reminders').insert({
    title,
    body,
    due_at,
    whatsapp_message: whatsapp_message || null,
    done: false,
    status: 'pending',
  }).select().single()
  return { data, error }
}
