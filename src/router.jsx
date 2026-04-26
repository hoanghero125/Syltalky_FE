import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store'

import AppLayout from './layouts/AppLayout'

import LoginScreen from './screens/auth/LoginScreen'
import RegisterScreen from './screens/auth/RegisterScreen'
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen'
import CheckInboxScreen from './screens/auth/CheckInboxScreen'
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen'
import EmailVerifiedScreen from './screens/auth/EmailVerifiedScreen'

import HomeScreen from './screens/HomeScreen'
import LibraryScreen from './screens/LibraryScreen'
import MeetingDetailScreen from './screens/MeetingDetailScreen'

import DeviceCheckScreen from './screens/meeting/DeviceCheckScreen'
import MeetingRoomScreen from './screens/meeting/MeetingRoomScreen'

function PrivateRoute({ children }) {
  const accessToken = useStore((s) => s.accessToken)
  return accessToken ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const accessToken = useStore((s) => s.accessToken)
  return accessToken ? <Navigate to="/" replace /> : children
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest only */}
        <Route path="/login" element={<GuestRoute><LoginScreen /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterScreen /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordScreen /></GuestRoute>} />
        <Route path="/check-inbox" element={<CheckInboxScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/verify-email" element={<EmailVerifiedScreen />} />

        {/* Meeting room — full-screen, no app layout */}
        <Route path="/meeting/:roomCode" element={<PrivateRoute><DeviceCheckScreen /></PrivateRoute>} />
        <Route path="/meeting/:roomCode/room" element={<PrivateRoute><MeetingRoomScreen /></PrivateRoute>} />

        {/* Main app */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<HomeScreen />} />
          <Route path="library" element={<LibraryScreen />} />
          <Route path="library/:meetingId" element={<MeetingDetailScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
