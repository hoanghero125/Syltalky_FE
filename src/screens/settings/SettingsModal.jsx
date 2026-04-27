import { useState, useEffect } from 'react'
import OverviewPanel from './OverviewPanel'
import VoicePanel from './VoicePanel'

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'voice',    label: 'Giọng nói' },
]

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('overview')

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Be Vietnam Pro", sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 680, maxHeight: '82vh',
          background: '#0F1117', borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          display: 'flex', overflow: 'hidden',
          animation: 'modal-in 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <style>{`
          @keyframes modal-in {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Left tab rail */}
        <div style={{
          width: 180, flexShrink: 0, padding: '24px 10px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', marginBottom: 8 }}>
            Cài đặt
          </p>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 12px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.42)',
              fontWeight: tab === t.id ? 600 : 400, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
              onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.42)' } }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {tab === 'overview' && <OverviewPanel />}
          {tab === 'voice'    && <VoicePanel />}
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >✕</button>
      </div>
    </div>
  )
}
