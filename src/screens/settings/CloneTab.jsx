import { useState, useRef, useEffect } from 'react'
import { api } from '../../api/client'
import useStore from '../../store'
import { Section } from './OverviewPanel'
import AudioTrimmer from '../../components/AudioTrimmer'

const MAX_DURATION = 15 // seconds

// Decode audioBlob, slice [startSec, endSec], re-encode to WAV.
// WAV is universally seekable — avoids issues with WebM blobs lacking seek index.
async function trimToWav(audioBlob, startSec, endSec) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  try {
    const decoded = await ctx.decodeAudioData(await audioBlob.arrayBuffer())
    const sr  = decoded.sampleRate
    const s   = Math.floor(startSec * sr)
    const e   = Math.min(Math.ceil(endSec * sr), decoded.length)
    const len = Math.max(1, e - s)
    const buf = ctx.createBuffer(decoded.numberOfChannels, len, sr)
    for (let c = 0; c < decoded.numberOfChannels; c++) {
      buf.getChannelData(c).set(decoded.getChannelData(c).subarray(s, e))
    }
    return _bufToWav(buf)
  } finally {
    ctx.close()
  }
}

function _bufToWav(buf) {
  const nCh = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length
  const ab = new ArrayBuffer(44 + n * nCh * 2)
  const v  = new DataView(ab)
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true); ws(8, 'WAVE')
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, nCh, true); v.setUint32(24, sr, true)
  v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true)
  ws(36, 'data'); v.setUint32(40, n * nCh * 2, true)
  let off = 44
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      v.setInt16(off, Math.round(Math.max(-1, Math.min(1, buf.getChannelData(c)[i])) * 32767), true)
      off += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

const RECORD_PROMPT = 'Xin chào, đây là giọng nói của tôi. Tôi đang thu âm để tạo hồ sơ giọng AI cá nhân. Hệ thống sẽ học và tái tạo giọng của tôi một cách tự nhiên trong các cuộc họp. Chất lượng âm thanh rõ ràng sẽ giúp AI nhận diện chính xác hơn.'

export default function CloneTab({ onActiveVoiceChange, activeProfileId }) {
  const { accessToken } = useStore()
  const [view, setView] = useState('list')
  const [profiles, setProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [activeId, setActiveId] = useState(activeProfileId ?? null)

  // Sync if parent resolves activeProfileId after initial render
  useEffect(() => { setActiveId(activeProfileId ?? null) }, [activeProfileId])

  useEffect(() => {
    api.get('/voices', accessToken)
      .then(data => setProfiles(data ?? []))
      .catch(() => {})
      .finally(() => setLoadingProfiles(false))
  }, [accessToken])

  const handleDelete = async (id) => {
    await api.delete(`/voices/${id}`, accessToken).catch(() => {})
    setProfiles(p => p.filter(x => x.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const handleSetActive = async (id) => {
    await api.patch('/users/me/voice-config', { mode: 'clone', active_voice_profile_id: id }, accessToken).catch(() => {})
    setActiveId(id)
    const name = profiles.find(x => x.id === id)?.name ?? ''
    onActiveVoiceChange?.(id, name)
  }

  const handleRename = async (id, newName) => {
    await api.patch(`/voices/${id}`, { name: newName }, accessToken).catch(() => {})
    setProfiles(p => p.map(x => x.id === id ? { ...x, name: newName } : x))
    if (id === activeId) onActiveVoiceChange?.(id, newName)
  }

  const handleCreated = (profile) => {
    setProfiles(p => [...p, profile])
    setView('list')
  }

  if (view === 'create') {
    return <CreateProfileView onBack={() => setView('list')} onCreated={handleCreated} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Hồ sơ giọng nói" desc="Chọn hồ sơ để dùng trong cuộc họp, hoặc tạo mới">
        {loadingProfiles ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', padding: '8px 0' }}>Đang tải...</div>
        ) : profiles.length === 0 ? (
          <div style={{
            padding: '28px 20px', borderRadius: 10, textAlign: 'center',
            border: '1.5px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>🎙</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Chưa có hồ sơ giọng nào</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profiles.map(p => (
              <ProfileCard key={p.id} profile={p} isActive={p.id === activeId} onDelete={handleDelete} onSetActive={handleSetActive} onRename={handleRename} />
            ))}
          </div>
        )}

        <button
          onClick={() => setView('create')}
          style={{
            marginTop: 4, padding: '10px 18px', borderRadius: 9, cursor: 'pointer',
            background: 'rgba(0,201,184,0.07)', border: '1.5px dashed rgba(0,201,184,0.3)',
            color: '#00C9B8', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
            alignSelf: 'flex-start',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,184,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,201,184,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,184,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,201,184,0.3)' }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Tạo hồ sơ mới
        </button>
      </Section>
    </div>
  )
}

function ProfileCard({ profile, isActive, onDelete, onSetActive, onRename }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile.name)
  const [saving, setSaving] = useState(false)
  const editInputRef = useRef(null)

  useEffect(() => { if (editing) editInputRef.current?.focus() }, [editing])

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(profile.id)
  }

  const cancelDelete = (e) => {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  const handleEditSave = async (e) => {
    e.stopPropagation()
    const name = editName.trim()
    if (!name || name === profile.name) { setEditing(false); setEditName(profile.name); return }
    setSaving(true)
    await onRename(profile.id, name)
    setSaving(false)
    setEditing(false)
  }

  const handleEditCancel = (e) => {
    e.stopPropagation()
    setEditName(profile.name)
    setEditing(false)
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleEditSave(e)
    if (e.key === 'Escape') handleEditCancel(e)
  }

  return (
    <div
      onClick={() => !isActive && !editing && onSetActive(profile.id)}
      style={{
        padding: '12px 14px', borderRadius: 10,
        border: `1.5px solid ${isActive ? '#00C9B8' : 'rgba(255,255,255,0.08)'}`,
        background: isActive ? 'rgba(0,201,184,0.06)' : 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
        cursor: isActive || editing ? 'default' : 'pointer',
      }}
      onMouseEnter={e => { if (!isActive && !editing) { e.currentTarget.style.borderColor = 'rgba(0,201,184,0.3)'; e.currentTarget.style.background = 'rgba(0,201,184,0.03)' } }}
      onMouseLeave={e => { if (!isActive && !editing) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: isActive ? '#00C9B8' : 'rgba(255,255,255,0.15)',
        boxShadow: isActive ? '0 0 6px #00C9B8' : 'none',
        transition: 'all 0.2s',
      }} />

      <div style={{ flex: 1, minWidth: 0 }} onClick={e => editing && e.stopPropagation()}>
        {editing ? (
          <input
            ref={editInputRef}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,201,184,0.5)',
              color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.65)' }}>
              {profile.name}
            </div>
            {isActive && (
              <div style={{ fontSize: 11, color: '#00C9B8', marginTop: 2 }}>Đang dùng</div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {editing ? (
          <>
            <button
              onClick={handleEditSave}
              disabled={saving}
              title="Lưu tên"
              style={{
                width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(0,201,184,0.4)',
                background: 'rgba(0,201,184,0.1)', color: '#00C9B8',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              {saving
                ? <MiniSpinner />
                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              }
            </button>
            <button
              onClick={handleEditCancel}
              title="Huỷ"
              style={{
                width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </>
        ) : confirmDelete ? (
          <>
            <span style={{ fontSize: 11, color: '#F87171' }}>Xoá?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)',
                color: '#F87171', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {deleting ? '...' : 'Xác nhận'}
            </button>
            <button
              onClick={cancelDelete}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Huỷ
            </button>
          </>
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); setEditName(profile.name); setEditing(true) }}
              title="Đổi tên"
              style={{
                width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,201,184,0.35)'; e.currentTarget.style.color = '#00C9B8'; e.currentTarget.style.background = 'rgba(0,201,184,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={handleDelete}
              title="Xoá hồ sơ"
              style={{
                width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CreateProfileView({ onBack, onCreated }) {
  const { accessToken } = useStore()
  const [inputMode, setInputMode] = useState('record')
  const [profileName, setProfileName] = useState('')

  // Audio state
  const [audioBlob, setAudioBlob]     = useState(null)
  const [trimStart, setTrimStart]     = useState(0)
  const [trimEnd, setTrimEnd]         = useState(MAX_DURATION)

  // Recording state
  const [recording, setRecording]     = useState(false)
  const [recSeconds, setRecSeconds]   = useState(0)
  const recStartTimeRef = useRef(0)
  const recSecondsRef   = useRef(0)
  const recIntervalRef  = useRef(null)
  const recTimeoutRef   = useRef(null)
  const mediaRecRef     = useRef(null)
  const chunksRef       = useRef([])

  // STT / process state
  const [transcribing, setTranscribing]       = useState(false)
  const [transcript, setTranscript]           = useState('')
  const [transcriptReady, setTranscriptReady] = useState(false)
  const [processing, setProcessing]           = useState(false)
  const [processError, setProcessError]       = useState('')

  // Recording review state
  const [recDone, setRecDone]                 = useState(false)

  // After processing: holds the created profile for demo
  const [processed, setProcessed]             = useState(null) // { id, name }

  // Demo state (post-process)
  const [demoText, setDemoText]   = useState('Xin chào! Đây là giọng nói AI của tôi.')
  const [demoing, setDemoing]     = useState(false)
  const [demoError, setDemoError] = useState('')

  const resetAudio = () => {
    setAudioBlob(null)
    setTrimStart(0); setTrimEnd(MAX_DURATION)
    setTranscript(''); setTranscriptReady(false)
    setProcessed(null); setProcessError('')
    setRecDone(false)
  }

  /* ---- Upload ---- */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    resetAudio()
    setAudioBlob(file)
  }

  /* ---- Record ---- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      mediaRecRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = e => chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        resetAudio()
        setAudioBlob(blob)
        setRecDone(true)
      }
      rec.start()
      setRecording(true)
      setRecDone(false)
      setRecSeconds(0)
      recSecondsRef.current = 0
      recStartTimeRef.current = Date.now()

      // Update display every 100ms using wall-clock time
      recIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - recStartTimeRef.current) / 1000
        const clamped = Math.min(elapsed, MAX_DURATION)
        recSecondsRef.current = clamped
        setRecSeconds(clamped)
      }, 100)

      // Stop exactly at MAX_DURATION
      recTimeoutRef.current = setTimeout(() => stopRecording(), MAX_DURATION * 1000)
    } catch {
      alert('Không thể truy cập microphone')
    }
  }

  const stopRecording = () => {
    clearInterval(recIntervalRef.current)
    clearTimeout(recTimeoutRef.current)
    mediaRecRef.current?.stop()
    setRecording(false)
  }

  useEffect(() => () => {
    clearInterval(recIntervalRef.current)
    clearTimeout(recTimeoutRef.current)
    mediaRecRef.current?.stop()
  }, [])

  /* ---- Review actions ---- */
  const handleReviewContinue = () => {
    setTranscript(RECORD_PROMPT)
    setTranscriptReady(true)
    setRecDone(false)
  }

  const handleReviewRetake = () => {
    resetAudio()
  }

  /* ---- STT ---- */
  const handleTranscribe = async () => {
    if (!audioBlob) return
    setTranscribing(true)
    try {
      const trimmed = await trimToWav(audioBlob, trimStart, trimEnd)
      const form = new FormData()
      form.append('file', trimmed, 'audio.wav')
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/stt/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      })
      if (!res.ok) throw new Error('Lỗi nhận dạng giọng')
      const data = await res.json()
      setTranscript(data.text ?? '')
      setTranscriptReady(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setTranscribing(false)
    }
  }

  /* ---- Process voice (create profile) ---- */
  const handleProcess = async () => {
    if (!profileName.trim() || !audioBlob || !transcriptReady) return
    setProcessing(true); setProcessError('')
    try {
      const trimmed = await trimToWav(audioBlob, trimStart, trimEnd)
      const form = new FormData()
      form.append('name', profileName.trim())
      form.append('ref_audio', trimmed, 'audio.wav')
      form.append('ref_text', transcript)
      const data = await api.postForm('/voices', form, accessToken)
      setProcessed(data)
    } catch (e) {
      setProcessError(e.message)
    } finally {
      setProcessing(false)
    }
  }

  /* ---- Demo processed voice ---- */
  const handleDemo = async () => {
    if (!demoText.trim() || !processed) return
    setDemoing(true); setDemoError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/tts/demo/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ text: demoText, voice_id: processed.id }),
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

  /* ---- Discard processed voice ---- */
  const handleDiscard = async () => {
    if (processed) {
      await api.delete(`/voices/${processed.id}`, accessToken).catch(() => {})
    }
    resetAudio()
  }

  const canProcess = profileName.trim() && transcriptReady && transcript.trim() && !processing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Quay lại
      </button>

      {/* Profile name */}
      <Section title="Tạo hồ sơ mới" desc="Đặt tên cho hồ sơ giọng nói của bạn">
        <input
          value={profileName}
          onChange={e => setProfileName(e.target.value)}
          placeholder="Ví dụ: Giọng tự nhiên"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 9,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#00C9B8'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
        />
      </Section>

      {/* Source toggle + input */}
      <Section title="Nguồn âm thanh" desc="Tải lên tệp hoặc thu âm trực tiếp (tối đa 15 giây)">
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ id: 'record', label: 'Thu âm' }, { id: 'upload', label: 'Tải lên tệp' }].map(opt => (
            <button
              key={opt.id}
              onClick={() => { setInputMode(opt.id); resetAudio() }}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${inputMode === opt.id ? '#00C9B8' : 'rgba(255,255,255,0.08)'}`,
                background: inputMode === opt.id ? 'rgba(0,201,184,0.08)' : 'rgba(255,255,255,0.03)',
                color: inputMode === opt.id ? '#00C9B8' : 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Upload drop zone */}
        {inputMode === 'upload' && (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            padding: '24px 16px', borderRadius: 10, cursor: 'pointer',
            border: `1.5px dashed ${audioBlob ? 'rgba(0,201,184,0.4)' : 'rgba(255,255,255,0.12)'}`,
            background: audioBlob ? 'rgba(0,201,184,0.04)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!audioBlob) { e.currentTarget.style.borderColor = 'rgba(0,201,184,0.35)'; e.currentTarget.style.background = 'rgba(0,201,184,0.04)' } }}
            onMouseLeave={e => { if (!audioBlob) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
          >
            <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            {audioBlob ? (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00C9B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 12, color: '#00C9B8', fontWeight: 600 }}>Tệp đã chọn — nhấn để thay đổi</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Nhấn để chọn tệp âm thanh
                  <br />
                  <span style={{ opacity: 0.6 }}>MP3, WAV, WebM, OGG, FLAC...</span>
                </span>
              </>
            )}
          </label>
        )}

        {/* Record zone */}
        {inputMode === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Prompt text — shown before and during recording, hidden during review */}
            {!recDone && (
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: recording ? 'rgba(248,113,113,0.06)' : 'rgba(0,201,184,0.05)',
                border: `1px solid ${recording ? 'rgba(248,113,113,0.2)' : 'rgba(0,201,184,0.15)'}`,
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, color: recording ? '#F87171' : '#00C9B8' }}>
                  {recording ? '🎙 Đọc đoạn văn bên dưới' : 'Văn bản mẫu — hãy đọc to và rõ ràng'}
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: recording ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: recording ? 500 : 400 }}>
                  {RECORD_PROMPT}
                </p>
              </div>
            )}

            {/* Ring timer + start button — hidden after recording done */}
            {!recDone && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                  <circle
                    cx="44" cy="44" r="38" fill="none"
                    stroke={recording ? '#F87171' : '#00C9B8'}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 38}
                    strokeDashoffset={2 * Math.PI * 38 * (1 - recSeconds / MAX_DURATION)}
                    style={{ transition: 'stroke-dashoffset 0.15s linear' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  {recording && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F87171', boxShadow: '0 0 8px #F87171', animation: 'pulse 1s ease-in-out infinite' }} />
                  )}
                  <span style={{ fontSize: 17, fontWeight: 700, color: recording ? '#F87171' : 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                    {String(Math.floor(recSeconds / 60)).padStart(2, '0')}:{String(Math.floor(recSeconds % 60)).padStart(2, '0')}
                  </span>
                  {!recording && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{MAX_DURATION}s</span>}
                </div>
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>

              {!recording && !audioBlob && (
                <button
                  onClick={startRecording}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 9,
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
                  Bắt đầu thu âm
                </button>
              )}

              {recording && (
                <button
                  onClick={() => { stopRecording(); resetAudio() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 9,
                    border: '1.5px solid rgba(248,113,113,0.4)',
                    background: 'rgba(248,113,113,0.08)',
                    color: '#F87171',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                  Dừng &amp; Ghi lại
                </button>
              )}

            </div>
            )}

            {recDone && !recording && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AudioTrimmer
                  audioBlob={audioBlob}
                  maxDuration={MAX_DURATION}
                  onChange={(s, e) => { setTrimStart(s); setTrimEnd(e) }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleReviewContinue}
                    style={{
                      flex: 2, padding: '9px', borderRadius: 8, cursor: 'pointer',
                      background: 'linear-gradient(135deg,#00C9B8,#0099CC)', border: 'none',
                      color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                      boxShadow: '0 3px 12px rgba(0,201,184,0.2)', transition: 'all 0.15s',
                    }}
                  >
                    Tiếp tục
                  </button>
                  <button
                    onClick={handleReviewRetake}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                  >
                    Thu lại
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Waveform trimmer — only for upload mode */}
      {audioBlob && inputMode === 'upload' && (
        <Section
          title="Cắt âm thanh"
          desc="Kéo hai đầu để chọn đoạn muốn dùng (tối đa 15 giây)"
        >
          <AudioTrimmer
            audioBlob={audioBlob}
            maxDuration={MAX_DURATION}
            onChange={(s, e) => { setTrimStart(s); setTrimEnd(e) }}
          />
        </Section>
      )}

      {/* Transcribe button — only for upload mode */}
      {audioBlob && inputMode === 'upload' && !transcriptReady && (
        <button
          onClick={handleTranscribe}
          disabled={transcribing}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 9,
            background: transcribing ? 'rgba(0,201,184,0.25)' : 'rgba(0,201,184,0.1)',
            border: '1px solid rgba(0,201,184,0.3)',
            color: '#00C9B8', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            cursor: transcribing ? 'default' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {transcribing ? <><MiniSpinner /> Đang nhận dạng...</> : 'Nhận dạng giọng nói'}
        </button>
      )}

      {/* Transcript editor — upload only */}
      {transcriptReady && inputMode === 'upload' && !processed && (
        <Section title="Bản ghi lời nói" desc="Kiểm tra và chỉnh sửa nếu AI nhận dạng sai">
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={7}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 9, resize: 'vertical',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s', boxSizing: 'border-box', lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderColor = '#00C9B8'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
          />
          <button
            onClick={handleTranscribe}
            disabled={transcribing}
            style={{
              alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Nhận dạng lại
          </button>
        </Section>
      )}

      {/* Process button */}
      {transcriptReady && !processed && (
        <>
          {processError && <p style={{ margin: 0, fontSize: 12, color: '#F87171' }}>{processError}</p>}
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 9,
              background: canProcess ? 'linear-gradient(135deg,#00C9B8,#0099CC)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: canProcess ? '#fff' : 'rgba(255,255,255,0.3)',
              fontWeight: 700, fontSize: 14, cursor: canProcess ? 'pointer' : 'default',
              fontFamily: 'inherit', boxShadow: canProcess ? '0 4px 16px rgba(0,201,184,0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {processing ? <><MiniSpinner /> Đang xử lý...</> : 'Xử lý giọng nói'}
          </button>
        </>
      )}

      {/* Demo + confirm section — shown after processing */}
      {processed && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14,
          padding: '18px', borderRadius: 12,
          background: 'rgba(0,201,184,0.05)', border: '1px solid rgba(0,201,184,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C9B8', boxShadow: '0 0 6px #00C9B8' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Giọng đã xử lý xong — nghe thử trước khi lưu</span>
          </div>

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
              padding: '8px 18px', borderRadius: 8, cursor: demoing ? 'default' : 'pointer',
              background: 'rgba(0,201,184,0.12)', border: '1px solid rgba(0,201,184,0.3)',
              color: '#00C9B8', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {demoing
              ? <><MiniSpinner /> Đang tạo giọng...</>
              : <><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Nghe thử</>
            }
          </button>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => onCreated(processed)}
              style={{
                flex: 2, padding: '10px', borderRadius: 9, cursor: 'pointer',
                background: 'linear-gradient(135deg,#00C9B8,#0099CC)', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(0,201,184,0.25)', transition: 'all 0.2s',
              }}
            >
              Lưu hồ sơ này
            </button>
            <button
              onClick={handleDiscard}
              style={{
                flex: 1, padding: '10px', borderRadius: 9, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(248,113,113,0.3)',
                color: '#F87171', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Xoá &amp; làm lại
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniSpinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}
