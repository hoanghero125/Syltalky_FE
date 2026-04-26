import { Outlet } from 'react-router-dom'
import { theme } from '../styles/theme'

export default function AppLayout() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: theme.colors.bg,
      overflow: 'hidden',
    }}>
      {/* Sidebar placeholder — implemented in Phase 2 */}
      <div style={{
        width: 220,
        flexShrink: 0,
        background: theme.colors.bgSecondary,
        borderRight: `1px solid ${theme.colors.border}`,
      }} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  )
}
