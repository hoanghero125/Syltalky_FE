import { useNavigate } from 'react-router-dom'
import useStore from '../store'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { user } = useStore()

  return (
    <div style={{
      flex: 1, height: '100%', overflowY: 'auto', padding: '40px 44px',
      fontFamily: '"Be Vietnam Pro", sans-serif', color: '#E8EAF0',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>
          Xin chào,
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', margin: 0 }}>
          {user?.display_name ?? 'bạn'} 👋
        </h1>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 52, flexWrap: 'wrap' }}>
        <ActionCard
          title="Tạo phòng mới"
          desc="Bắt đầu cuộc họp ngay lập tức"
          accent="#00C9B8"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          }
          onClick={() => navigate('/meeting/new')}
        />
        <ActionCard
          title="Nhập mã phòng"
          desc="Tham gia cuộc họp của người khác"
          accent="#A78BFA"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          }
          onClick={() => {}}
        />
      </div>

      {/* Recent meetings — empty state */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.3px' }}>
          Cuộc họp gần đây
        </h2>
        <EmptyState />
      </div>
    </div>
  )
}

function ActionCard({ title, desc, accent, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '20px 24px', borderRadius: 14, border: `1px solid ${accent}22`,
      background: `${accent}0A`, cursor: 'pointer', textAlign: 'left',
      minWidth: 200, transition: 'all 0.2s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.borderColor = `${accent}44`; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = `${accent}0A`; e.currentTarget.style.borderColor = `${accent}22`; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ color: accent, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
    </button>
  )
}

function EmptyState() {
  return (
    <div style={{
      padding: '56px 0', textAlign: 'center',
      border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16,
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 14 }}>
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Chưa có cuộc họp nào</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', margin: '6px 0 0' }}>Tạo hoặc tham gia một phòng để bắt đầu</p>
    </div>
  )
}
