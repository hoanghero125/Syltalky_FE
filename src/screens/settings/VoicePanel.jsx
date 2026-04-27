import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import useStore from '../../store'

const GENDER_TAGS  = ['female', 'male', 'neutral']
const AGE_TAGS     = ['child', 'teen', 'young adult', 'adult', 'elderly']
const PITCH_TAGS   = ['low pitch', 'moderate pitch', 'high pitch']
const SPEED_TAGS   = ['slow', 'moderate speed', 'fast']

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
  const [config, setConfig]   = useState(null)
  const [sel, setSel]         = useState({ gender: '', age: '', pitch: '', speed: '' })
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/users/me/voice-config', accessToken)
      .then(data => { setConfig(data); setSel(parseInstruct(data?.design_instruct)) })
      .catch(() => {})
  }, [accessToken])

  const pick = (key, val) => setSel(s => ({ ...s, [key]: s[key] === val ? '' : val }))

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const updated = await api.patch('/users/me/voice-config', {
        mode: 'design',
        design_instruct: buildInstruct(sel),
      }, accessToken)
      setConfig(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Giọng nói</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Tuỳ chỉnh giọng AI sẽ phát biểu thay bạn trong cuộc họp</p>
      </div>

      {/* Mode — design only for Phase 3 */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,201,184,0.08)', border: '1px solid rgba(0,201,184,0.2)',
        borderRadius: 8, padding: '7px 14px',
        fontSize: 13, color: '#00C9B8', fontWeight: 600, alignSelf: 'flex-start',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C9B8', boxShadow: '0 0 6px #00C9B8' }}/>
        Chế độ: Thiết kế giọng
      </div>

      {/* Preview */}
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
      }}>
        {buildInstruct(sel) || <span style={{ color: 'rgba(255,255,255,0.25)' }}>Chọn các thẻ bên dưới để tạo giọng...</span>}
      </div>

      <TagGroup label="Giới tính" tags={GENDER_TAGS} selected={sel.gender} onPick={v => pick('gender', v)} color="#00C9B8"/>
      <TagGroup label="Độ tuổi"   tags={AGE_TAGS}    selected={sel.age}    onPick={v => pick('age', v)}    color="#A78BFA"/>
      <TagGroup label="Cao độ"    tags={PITCH_TAGS}  selected={sel.pitch}  onPick={v => pick('pitch', v)}  color="#FB923C"/>
      <TagGroup label="Tốc độ"    tags={SPEED_TAGS}  selected={sel.speed}  onPick={v => pick('speed', v)}  color="#34D399"/>

      {error && <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{error}</p>}

      <button onClick={handleSave} disabled={saving} style={{
        padding: '11px 28px', borderRadius: 9, border: 'none', alignSelf: 'flex-start',
        background: saving ? 'rgba(0,201,184,0.4)' : 'linear-gradient(135deg, #00C9B8, #0099CC)',
        color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer',
        boxShadow: saving ? 'none' : '0 4px 16px rgba(0,201,184,0.3)',
        fontFamily: 'inherit', transition: 'all 0.2s',
      }}>
        {saving ? 'Đang lưu...' : success ? '✓ Đã lưu' : 'Lưu thay đổi'}
      </button>
    </div>
  )
}

function TagGroup({ label, tags, selected, onPick, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(tag => {
          const active = selected === tag
          return (
            <button key={tag} onClick={() => onPick(tag)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
              border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
              background: active ? `${color}18` : 'transparent',
              color: active ? color : 'rgba(255,255,255,0.45)',
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
