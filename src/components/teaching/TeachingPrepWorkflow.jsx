import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronRight, Check, Copy, Lightbulb } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

const STEPS = [
  {
    step: 1,
    title: 'Anchor Scripture',
    field: 'anchor_scripture',
    description: 'The core scripture passage for this teaching',
    placeholder: 'e.g., John 3:16-18',
  },
  {
    step: 2,
    title: 'Create Outline',
    field: 'outline',
    description: 'Structure your teaching with key points',
    placeholder: 'e.g., I. Introduction\nII. Main Point 1\nIII. Main Point 2\nIV. Conclusion',
  },
  {
    step: 3,
    title: 'Discussion Questions',
    field: 'discussion_questions',
    description: 'Questions to deepen understanding',
    placeholder: 'e.g., What does this passage mean for your faith?\nHow can you apply this...',
  },
  {
    step: 4,
    title: 'Prayer Points',
    field: 'prayer_points',
    description: 'Key areas for prayer and intercession',
    placeholder: 'e.g., Pray for wisdom...\nPray for hearts to be open...',
  },
  {
    step: 5,
    title: 'Declarations',
    field: 'declarations',
    description: 'Faith declarations and affirmations',
    placeholder: 'e.g., I declare that God\'s Word is living and active...',
  },
]

export default function TeachingPrepWorkflow({ teaching, onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    anchor_scripture: teaching?.anchor_scripture || '',
    outline: teaching?.outline || '',
    discussion_questions: teaching?.discussion_questions || '',
    prayer_points: teaching?.prayer_points || '',
    declarations: teaching?.declarations || '',
  })
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(new Set(
    STEPS.filter(s => data[s.field]).map(s => s.step)
  ))

  const currentStepConfig = STEPS[step - 1]

  async function handleSave() {
    setSaving(true)
    try {
      await supabase
        .from('teaching_calendar')
        .update({
          anchor_scripture: data.anchor_scripture || null,
          outline: data.outline || null,
          discussion_questions: data.discussion_questions || null,
          prayer_points: data.prayer_points || null,
          declarations: data.declarations || null,
          preparation_status: 'In preparation',
        })
        .eq('id', teaching.id)
      onSave?.()
    } catch (err) {
      console.error('Save error:', err)
    }
    setSaving(false)
  }

  async function handleNext() {
    if (step < 5) {
      // Mark current step as completed
      if (data[currentStepConfig.field]) {
        setCompleted(prev => new Set([...prev, step]))
      }
      setStep(step + 1)
    }
  }

  async function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  const updateField = (value) => {
    setData(prev => ({ ...prev, [currentStepConfig.field]: value }))
  }

  const isStepComplete = data[currentStepConfig.field]?.trim().length > 0
  const completedCount = [...completed].length + (isStepComplete ? 1 : 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ minHeight: '70vh' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontFamily: FONT }}>Teaching Prep Workflow</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>
              {teaching?.event_name} • {teaching?.date}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: s.step <= step ? 'var(--accent)' : 'var(--border)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onClick={() => setStep(s.step)}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT }}>
            Step {step} of 5 • {completedCount} sections completed
          </p>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Step Header */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT, marginBottom: 4 }}>
              {currentStepConfig.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: FONT }}>
              {currentStepConfig.description}
            </p>
          </div>

          {/* Input */}
          <textarea
            value={data[currentStepConfig.field]}
            onChange={e => updateField(e.target.value)}
            placeholder={currentStepConfig.placeholder}
            style={{
              width: '100%',
              minHeight: 200,
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontFamily: FONT,
              fontSize: 13,
              lineHeight: 1.6,
              resize: 'vertical',
              marginBottom: 16,
            }}
          />

          {/* AI Suggestion Button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 14px',
              cursor: 'pointer',
              marginBottom: 20,
              fontFamily: FONT,
            }}
          >
            <Lightbulb size={14} />
            Ask Assistant to Help
          </button>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleBack}
              disabled={step === 1}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: step === 1 ? 'var(--text-muted)' : 'var(--accent)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Back
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  background: isStepComplete ? 'var(--accent)' : '#ccc',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: isStepComplete ? 'pointer' : 'not-allowed',
                  fontFamily: FONT,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                <Check size={14} /> {saving ? 'Saving...' : 'Finish & Save'}
              </button>
            )}
          </div>

          {/* Tips */}
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: 'var(--accent-dim)',
              borderRadius: 8,
              borderLeft: '3px solid var(--accent)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: FONT, lineHeight: 1.5 }}>
              💡 <strong>Tip:</strong> You can use the "Ask Assistant" button to generate suggestions for each section, then edit them to match your style.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
