import { useState } from 'react'
import { BookUser } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

const supportsContactPicker = () =>
  typeof navigator !== 'undefined' &&
  'contacts' in navigator &&
  'ContactsManager' in window

export default function PhoneInput({ value, onChange, placeholder = '+233...' }) {
  const [picking, setPicking] = useState(false)

  async function pickFromContacts() {
    if (!supportsContactPicker()) {
      alert('Contact picker is not supported on this browser. Please type the number manually.')
      return
    }
    try {
      setPicking(true)
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false })
      if (contacts.length > 0 && contacts[0].tel?.length > 0) {
        onChange(contacts[0].tel[0].replace(/\s+/g, ''))
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Contact picker error:', err)
      }
    } finally {
      setPicking(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        className="ksm-input"
        type="tel"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1 }}
      />
      <button
        type="button"
        onClick={pickFromContacts}
        disabled={picking}
        title="Select from contacts"
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: 'var(--accent-dim)',
          border: '1px solid var(--border)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: picking ? 'wait' : 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,155,56,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
      >
        <BookUser size={16} />
      </button>
    </div>
  )
}
