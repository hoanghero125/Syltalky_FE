import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import SettingsModal from '../screens/settings/SettingsModal'

export default function AppLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100%', background: '#07090F', overflow: 'hidden' }}>
      <Sidebar onSettings={() => setSettingsOpen(true)} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
