import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import useStore from '../../store'
import { Section } from './OverviewPanel'

const GENDER_TAGS = ['female', 'male', 'neutral']
const AGE_TAGS    = ['child', 'teen', 'young adult', 'adult', 'elderly']
const PITCH_TAGS  = ['low pitch', 'moderate pitch', 'high pitch']
const SPEED_TAGS  = ['slow', 'moderate speed', 'fast']

function buildInstruct(sel) {
  return [sel.gender, sel.age, sel.pitch, sel.speed].filter(Boolean).join(', ')
}

function parseInstruct(instruct) {
  const parts = (instruct ?? '').split(',').map(s => s.trim())
  return {
    gender: GENDER_TAGS.find(t => parts.includes(t)) ?? '',
    age:    AGE_TAGS.find(t => parts.includes(t)) ?? '',
    pitch:  PITCH_TAGS.find(t => parts.includes(t)) ?? '',
    speed:  SPEED_TAGS.find(t => parts.includes(t)) ?? '',
  }
}

export default function VoicePanel() {
  const { accessToken } = useStore()
  const [mode, setMode]     = useState('design')
  const [sel, setSel]       = useState({ gender: '', age: '', pitch: '', speed: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState('')
  const [demoText, setDemoText] = useState('Xin chào! Đây là giọng nói AI của tôi trong cuộc họp.')
  const [demoing, setDemoing]   = useState(false)
  const [demoError, setDemoError] = useState('')

  useEffect(() => {
    api.get('/users/me/voice-config', accessToken)
      .then(data => {
        if (data?.mode) setMode(data.mode)
        setSel(parseInstruct(data?.design_instruct))
      })
      .catch(() => {})
  }, [accessToken])

  const pick = (key, val) => setSel(s => ({ ...s, [key]: s[key] === val ? '' : val }))

  const handleDemo = async () => {
    if (!demoText.trim()) return
    setDemoing(true); setDemoError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/tts/demo/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ text: demoText, instruct: buildInstruct(sel) || 'female, young adult, moderate pitch, moderate speed' }),
      })
      if (!res.ok) throw new Error('Không thể tạo giọng — thử lại sau')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      audio.play()
    } catch (e) {
      setDemoError(e.message)
    } finally {
      setDemoing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false)
    try {
      await api.patch('/users/me/voice-config', {
        mode: 'design',
        design_instruct: buildInstruct(sel),
      }, accessToken)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const instruct = buildInstruct(sel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Mode selector */}
      <Section title="Chế độ giọng nói" desc="Cách AI tổng hợp giọng nói thay bạn trong cuộc họp">
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { id: 'design', label: 'Thiết kế', desc: 'Tạo giọng bằng các thuộc tính' },
            { id: 'clone',  label: 'Nhân bản', desc: 'Dùng giọng thật của bạn' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              style={{
                flex: 1, padding: '14px 16px', borderRadius: 10, textAlign: 'left',
                fontFamily: 'inherit', cursor: 'pointer',
                border: `1.5px solid ${mode === opt.id ? '#00C9B8' : 'rgba(255,255,255,0.08)'}`,
                background: mode === opt.id ? 'rgba(0,201,184,0.08)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: mode === opt.id ? '#00C9B8' : 'rgba(255,255,255,0.6)' }}>
                  {opt.label}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {mode === 'clone' && (
        <Section title="Hồ sơ giọng nói" desc="Tải lên hoặc thu âm giọng của bạn để AI nhân bản">
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
            Tính năng nhân bản giọng sẽ hiển thị ở đây — Phase 4
          </div>
        </Section>
      )}

      {mode === 'design' && (
        <>
          {/* Instruct preview */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(0,201,184,0.04)', border: '1px solid rgba(0,201,184,0.12)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C9B8', flexShrink: 0, boxShadow: '0 0 6px #00C9B8' }}/>
            <span style={{ fontSize: 13, color: instruct ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', fontStyle: instruct ? 'normal' : 'italic' }}>
              {instruct || 'Chọn các thuộc tính bên dưới để tạo giọng...'}
            </span>
          </div>

          <Section title="Thuộc tính giọng nói" desc="Kết hợp các thẻ để mô tả giọng AI mong muốn">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <TagGroup label="Giới tính" tags={GENDER_TAGS} selected={sel.gender} onPick={v => pick('gender', v)} color="#00C9B8"/>
              <TagGroup label="Độ tuổi"   tags={AGE_TAGS}    selected={sel.age}    onPick={v => pick('age', v)}    color="#A78BFA"/>
              <TagGroup label="Cao độ"    tags={PITCH_TAGS}  selected={sel.pitch}  onPick={v => pick('pitch', v)}  color="#FB923C"/>
              <TagGroup label="Tốc độ"    tags={SPEED_TAGS}  selected={sel.speed}  onPick={v => pick('speed', v)}  color="#34D399"/>
            </div>
          </Section>

          {/* Demo */}
          <Section title="Nghe thử" desc="Thử nghe giọng AI với văn bản tuỳ chỉnh">
            <textarea
              value={demoText}
              onChange={e => setDemoText(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9, resize: 'vertical',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s', boxSizing: 'border-box', lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = '#00C9B8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
            {demoError && <p style={{ margin: 0, fontSize: 12, color: '#F87171' }}>{demoError}</p>}
            <button
              onClick={handleDemo}
              disabled={demoing || !demoText.trim()}
              style={{
                alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 9, cursor: demoing ? 'default' : 'pointer',
                background: demoing ? 'rgba(0,201,184,0.3)' : 'rgba(0,201,184,0.12)',
                color: '#00C9B8', fontWeight: 600, fontSize: 13,
                fontFamily: 'inherit', transition: 'all 0.2s',
                border: '1px solid rgba(0,201,184,0.25)',
              }}
            >
              {demoing
                ? <><Spinner /> Đang tạo giọng...</>
                : <><PlayIcon /> Nghe thử</>
              }
            </button>
          </Section>
        </>
      )}

      {error && <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{error}</p>}

      {mode === 'design' && (
        <button onClick={handleSave} disabled={saving} style={{
          padding: '10px 24px', borderRadius: 9, alignSelf: 'flex-start',
          background: saving ? 'rgba(0,201,184,0.4)' : success ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#00C9B8,#0099CC)',
          color: success ? '#34D399' : '#fff', fontWeight: 700, fontSize: 14,
          cursor: saving ? 'default' : 'pointer',
          boxShadow: saving || success ? 'none' : '0 4px 16px rgba(0,201,184,0.25)',
          fontFamily: 'inherit', transition: 'all 0.2s',
          border: success ? '1px solid rgba(52,211,153,0.25)' : 'none',
        }}>
          {saving ? 'Đang lưu...' : success ? '✓ Đã lưu' : 'Lưu thay đổi'}
        </button>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  )
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}

function TagGroup({ label, tags, selected, onPick, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {tags.map(tag => {
          const active = selected === tag
          return (
            <button key={tag} onClick={() => onPick(tag)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 400,
              border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
              background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
              color: active ? color : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
