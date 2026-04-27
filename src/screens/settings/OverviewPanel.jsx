import { useState, useRef } from 'react'
import { api } from '../../api/client'
import useStore from '../../store'

export default function OverviewPanel() {
  const { user, accessToken, setUser } = useStore()
  const [name, setName]       = useState(user?.display_name ?? '')
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url ?? null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const fileRef = useRef()

  const handleAvatarPick = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    fileRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const form = new FormData()
      form.append('display_name', name)
      if (avatarFile) form.append('avatar', avatarFile)
      if (avatarPreview === null && user?.avatar_url) form.append('remove_avatar', 'true')

      const updated = await api.patchForm('/users/me', form, accessToken)
      setUser(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const avatarLetter = name?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Tổng quan</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Tên hiển thị và ảnh đại diện</p>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: avatarPreview
            ? `url(${avatarPreview}) center/cover`
            : 'linear-gradient(135deg, #00C9B8, #0099CC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 700, color: '#fff',
          border: '2px solid rgba(255,255,255,0.1)',
        }}>
          {!avatarPreview && avatarLetter}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarPick}/>
          <button onClick={() => fileRef.current.click()} style={ghostBtn}>
            Tải ảnh lên
          </button>
          {avatarPreview && (
            <button onClick={handleRemoveAvatar} style={{ ...ghostBtn, color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
              Xoá ảnh
            </button>
          )}
        </div>
      </div>

      {/* Display name */}
      <div>
        <label style={labelStyle}>Tên hiển thị</label>
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#00C9B8'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label style={labelStyle}>Email</label>
        <input value={user?.email ?? ''} readOnly style={{ ...inputStyle, color: 'rgba(255,255,255,0.3)', cursor: 'default' }}/>
      </div>

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

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em',
  textTransform: 'uppercase', marginBottom: 8,
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 9,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: 14, outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const ghostBtn = {
  padding: '7px 16px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent', color: 'rgba(255,255,255,0.6)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit', transition: 'all 0.15s',
}
