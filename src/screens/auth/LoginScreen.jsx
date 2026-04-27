import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../api/client'
import useStore from '../../store'
import AuthLeft from './AuthLeft'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { setUser, setTokens } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      setTokens(data.access_token)
      setUser(data.user)
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', background: '#07090F' }}>
      <AuthLeft />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px', overflowY: 'auto' }}>
        <form onSubmit={submit} style={{ maxWidth: 360, width: '100%' }}>
          <p style={{ fontSize: 12, color: '#00C9B8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Chào mừng trở lại
          </p>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', margin: '0 0 40px' }}>
            Đăng nhập
          </h2>

          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" autoFocus />
          <Field label="Mật khẩu" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword}
            autoComplete="current-password" showToggle onToggle={() => setShowPass(s => !s)} showPass={showPass} />

          <div style={{ textAlign: 'right', marginBottom: 28, marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: '#00C9B8', textDecoration: 'none' }}>
              Quên mật khẩu?
            </Link>
          </div>

          {error && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: '#00C9B8', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, autoComplete, autoFocus, showToggle, onToggle, showPass }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          autoFocus={autoFocus}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          style={{
            width: '100%', padding: showToggle ? '13px 42px 13px 0' : '13px 0',
            background: 'transparent', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 15, outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderBottomColor = '#00C9B8'}
          onBlur={e => e.target.style.borderBottomColor = 'rgba(255,255,255,0.2)'}
        />
        {showToggle && (
          <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}>
            {showPass
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  )
}

function btnStyle(loading) {
  return {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: loading ? 'rgba(0,201,184,0.5)' : 'linear-gradient(135deg, #00C9B8, #0099CC)',
    color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
    boxShadow: loading ? 'none' : '0 8px 32px rgba(0,201,184,0.4)', transition: 'all 0.2s',
  }
}
