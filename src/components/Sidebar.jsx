import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useStore from '../store'

const IC = {
  home: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  library: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  plus: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  link: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  bell: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

const NAV = [
  { path: '/home',    label: 'Trang chủ', icon: IC.home },
  { path: '/library', label: 'Thư viện',   icon: IC.library },
]

export default function Sidebar({ onSettings }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, notifications, logout } = useStore()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [joinMode, setJoinMode] = useState(false)
  const [code, setCode]         = useState('')

  const unread = notifications.filter(n => !n.is_read).length

  const handleJoin = (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) { navigate(`/meeting/${trimmed}`); setCode(''); setJoinMode(false) }
  }

  const handleLogout = () => { logout(); navigate('/login') }


  const avatarLetter = user?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{
      width: 220, flexShrink: 0, height: '100%',
      background: '#0A0D16',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Be Vietnam Pro", sans-serif',
    }}>

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px' }}>
        <Link to="/" style={{ display: 'inline-block' }}>
          <img src="/images/full_logo_transparent.png" alt="Syltalky"
            style={{ height: 34, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
          />
          <span style={{ display: 'none', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Syl<span style={{ color: '#00C9B8' }}>talky</span>
          </span>
        </Link>
      </div>

      {/* CTA buttons */}
      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => navigate('/meeting/new')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '9px 0', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #00C9B8, #0099CC)',
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,201,184,0.25)',
            fontFamily: 'inherit',
          }}
        >
          {IC.plus} Phòng mới
        </button>

        {joinMode ? (
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: 5 }}>
            <input
              autoFocus value={code} onChange={e => setCode(e.target.value)}
              placeholder="Mã phòng"
              style={{
                flex: 1, padding: '7px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button type="submit" style={{
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: 'rgba(0,201,184,0.2)', color: '#00C9B8',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
            }}>Vào</button>
            <button type="button" onClick={() => setJoinMode(false)} style={{
              padding: '7px 8px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}>✕</button>
          </form>
        ) : (
          <button
            onClick={() => setJoinMode(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '8px 0', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.55)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {IC.link} Nhập mã phòng
          </button>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 12px' }}/>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
              color: active ? '#fff' : 'rgba(255,255,255,0.42)',
              background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
              fontWeight: active ? 600 : 400, fontSize: 13,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)' } }}
            >
              <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#00C9B8' }}/>}
            </Link>
          )
        })}
      </nav>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 12px' }}/>

      {/* Bottom — bell + user row */}
      <div style={{ padding: '10px 8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Notification bell */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 8, border: 'none',
          background: 'transparent', color: 'rgba(255,255,255,0.42)',
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          width: '100%', position: 'relative',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)' }}
        >
          <span style={{ opacity: 0.6, position: 'relative' }}>
            {IC.bell}
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                background: '#F87171', fontSize: 9, fontWeight: 700,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </span>
          Thông báo
        </button>

        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '7px 12px', borderRadius: 8,
          marginTop: 2,
        }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            ...(user?.avatar_url
              ? { backgroundImage: `url(${user.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
              : { background: 'linear-gradient(135deg, #00C9B8, #0099CC)' }),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            {!user?.avatar_url && avatarLetter}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name ?? '—'}
            </div>
          </div>

          {/* Settings */}
          <button onClick={onSettings} title="Cài đặt" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            {IC.settings}
          </button>

          {/* Logout */}
          <button onClick={() => setConfirmLogout(true)} title="Đăng xuất" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            {IC.logout}
          </button>
        </div>
      </div>

      {confirmLogout && (
        <div
          onClick={() => setConfirmLogout(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 600,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Be Vietnam Pro", sans-serif',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 340, background: '#0F1117', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              padding: '28px 28px 24px',
              animation: 'modal-in 0.18s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <style>{`@keyframes modal-in { from { opacity:0; transform:scale(0.95) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>Đăng xuất?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng tài khoản.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >Huỷ</button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9,
                  background: 'rgba(248,113,113,0.15)', color: '#F87171',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  border: '1px solid rgba(248,113,113,0.25)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)' }}
              >Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
