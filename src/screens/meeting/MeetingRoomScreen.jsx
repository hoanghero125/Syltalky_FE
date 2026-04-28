import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  VideoTrack,
} from '@livekit/components-react'
import { Track, RoomEvent, DisconnectReason } from 'livekit-client'
import useStore from '../../store'
import { meetingsApi } from '../../api/meetings'
import UserAvatar from '../../components/UserAvatar'
import SettingsModal from '../settings/SettingsModal'

/* ── Layout helpers ─────────────────────────────────────────────────────── */
const GAP = 8
const PAD = 10

const PAGE_SIZE = 16

function getArrangement(count) {
  if (count <= 1) return [1]
  if (count === 2) return [2]
  if (count === 3) return [2, 1]
  if (count === 4) return [2, 2]
  if (count === 5) return [3, 2]
  if (count === 6) return [3, 3]
  if (count === 7) return [3, 3, 1]
  if (count === 8) return [3, 3, 2]
  if (count === 9) return [3, 3, 3]
  if (count === 10) return [4, 3, 3]
  if (count === 11) return [4, 4, 3]
  if (count === 12) return [4, 4, 4]
  if (count === 13) return [4, 3, 3, 3]
  if (count === 14) return [4, 4, 3, 3]
  if (count === 15) return [4, 4, 4, 3]
  return [4, 4, 4, 4] // 16 max per page
}

function parseMetadata(raw) {
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

/* ── Root ───────────────────────────────────────────────────────────────── */
export default function MeetingRoomScreen() {
  const { roomCode } = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const { user, accessToken } = useStore()
  const state = location.state || {}

  const [authorized] = useState(
    () => sessionStorage.getItem('meeting_join_authorized') === '1'
  )

  useEffect(() => {
    sessionStorage.removeItem('meeting_join_authorized')
    if (!state.token || !authorized) {
      navigate(`/meeting/${roomCode}`, { replace: true })
    }
  }, [])

  if (!state.token || !authorized) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#060810', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
      <LiveKitRoom
        token={state.token}
        serverUrl={state.livekit_url}
        connect={true}
        audio={state.mic_on ?? true}
        video={state.cam_on ?? true}
        style={{ width: '100%', height: '100%' }}
      >
        <RoomAudioRenderer />
        <RoomInner
          roomCode={roomCode}
          meetingId={state.meeting_id}
          isHost={user?.id === state.host_id}
          accessToken={accessToken}
          localUser={user}
        />
      </LiveKitRoom>
    </div>
  )
}

/* ── RoomInner ──────────────────────────────────────────────────────────── */
function RoomInner({ roomCode, meetingId, isHost, accessToken, localUser }) {
  const navigate   = useNavigate()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const room       = useRoomContext()
  const { mirrorCamera } = useStore()

  const [panel,      setPanel]      = useState(null)
  const [elapsed,    setElapsed]    = useState(0)
  const [ending,     setEnding]     = useState(false)
  const [leaving,    setLeaving]    = useState(false)
  const [copyTip,    setCopyTip]    = useState(false)
  const [userInfoMap, setUserInfoMap] = useState({})
  const [roomEnded,    setRoomEnded]    = useState(false)
  const [wasKicked,    setWasKicked]    = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false) // identity → {display_name, avatar_url}

  const micEnabled         = localParticipant?.isMicrophoneEnabled  ?? false
  const camEnabled         = localParticipant?.isCameraEnabled      ?? false
  const screenShare        = localParticipant?.isScreenShareEnabled ?? false
  const someoneElseSharing = participants.some(p => !p.isLocal && p.isScreenShareEnabled)

  // Publish avatar URL to all participants via LiveKit metadata
  useEffect(() => {
    if (!localParticipant) return
    const metadata = JSON.stringify({ avatar_url: localUser?.avatar_url || '' })
    localParticipant.setMetadata(metadata).catch(() => {})
  }, [localParticipant, localUser?.avatar_url])

  useEffect(() => {
    const iv = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // Detect server-initiated disconnect (host ended meeting)
  useEffect(() => {
    function onDisconnected(reason) {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        setWasKicked(true)
      } else if (
        reason === DisconnectReason.ROOM_DELETED ||
        reason === DisconnectReason.SERVER_SHUTDOWN
      ) {
        setRoomEnded(true)
      }
    }
    room.on(RoomEvent.Disconnected, onDisconnected)
    return () => { room.off(RoomEvent.Disconnected, onDisconnected) }
  }, [room])

  // Fetch avatar + name for all participants from BE
  useEffect(() => {
    const remoteIds = participants
      .filter(p => !p.isLocal)
      .map(p => p.identity)
    if (!remoteIds.length) return
    const ids = remoteIds.join(',')
    fetch(`http://localhost:8001/users/by-ids?ids=${ids}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const map = {}
        data.forEach(u => { map[u.id] = u })
        setUserInfoMap(map)
      })
      .catch(() => {})
  }, [participants.map(p => p.identity).join(','), accessToken])

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopyTip(true)
    setTimeout(() => setCopyTip(false), 1800)
  }

  const handleLeave = useCallback(async () => {
    setLeaving(true)
    await room.disconnect()
    navigate('/home', { replace: true })
  }, [room, navigate])

  const handleEnd = useCallback(async () => {
    setEnding(true)
    try { if (meetingId) await meetingsApi.end(meetingId, accessToken) } catch {}
    await room.disconnect()
    navigate('/home', { replace: true })
  }, [room, navigate, meetingId, accessToken])

  const toggleMic    = () => localParticipant?.setMicrophoneEnabled(!micEnabled)
  const toggleCam    = () => localParticipant?.setCameraEnabled(!camEnabled)
  const toggleScreen = () => localParticipant?.setScreenShareEnabled(!screenShare)
  const togglePanel  = (name) => setPanel(p => p === name ? null : name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>

      {/* ── Content row: video + panel as true flex siblings ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Video area — shrinks when panel opens */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#060810', minWidth: 0 }}>
          <MeetGrid mirrorCamera={mirrorCamera} localUser={localUser} userInfoMap={userInfoMap} />
        </div>

        {/* Right panel — true layout sibling, animates width */}
        <div style={{
          width: panel ? 320 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          background: '#0A0D18',
          borderLeft: panel ? '1px solid rgba(255,255,255,0.07)' : 'none',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Keep content mounted so animation is smooth — just hide when width=0 */}
          <div style={{ width: 320, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              height: 52, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {{ participants: 'Người tham gia', chat: 'Chat', captions: 'Phụ đề', tts: 'Text-to-speech' }[panel] ?? ''}
              </span>
              <button onClick={() => setPanel(null)} style={{
                width: 28, height: 28, borderRadius: 7, border: 'none',
                background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {panel === 'participants' && <ParticipantsPanel participants={participants} userInfoMap={userInfoMap} localUser={localUser} isHost={isHost} meetingId={meetingId} accessToken={accessToken} />}
              {panel === 'captions'     && <ComingSoonPanel label="Phụ đề thời gian thực" phase="Phase 6" />}
              {panel === 'tts'          && <ComingSoonPanel label="Text-to-speech" phase="Phase 7" />}
              {panel === 'chat'         && <ComingSoonPanel label="Chat trong phòng" phase="Phase 6" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar — solid, 3-zone with absolutely positioned sides ── */}
      <div style={{
        height: 84, flexShrink: 0,
        background: '#0A0D18',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        position: 'relative', display: 'flex', alignItems: 'center',
      }}>

        {/* LEFT — logo + room code (absolutely placed, never affects center) */}
        <div style={{
          position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <img
            src="/images/full_logo_transparent.png"
            alt="Syltalky"
            style={{ height: 36, objectFit: 'contain', display: 'block', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }}
          />
          <span style={{ display: 'none', fontSize: 17, fontWeight: 900, background: 'linear-gradient(135deg, #00C9B8, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Syltalky</span>

          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

          <button onClick={handleCopyCode} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer', color: '#fff', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>{roomCode}</span>
            {copyTip
              ? <span style={{ fontSize: 10, color: '#00C9B8', fontWeight: 700 }}>✓</span>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            }
          </button>
        </div>

        {/* CENTER — controls, always exactly centered */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <IconBtn on={camEnabled}  onClick={toggleCam}    offRed><CamIcon on={camEnabled} size={20} /></IconBtn>
          <IconBtn on={micEnabled}  onClick={toggleMic}    offRed><MicIcon on={micEnabled} size={20} /></IconBtn>
          <ScreenShareBtn
            active={screenShare}
            disabled={someoneElseSharing && !screenShare}
            onClick={toggleScreen}
          />

          <Divider />

          <IconBtn on={panel === 'captions'} onClick={() => togglePanel('captions')}><CaptionIcon /></IconBtn>
          <IconBtn on={panel === 'tts'}      onClick={() => togglePanel('tts')}><TtsIcon /></IconBtn>
          <IconBtn on={panel === 'chat'}     onClick={() => togglePanel('chat')}><ChatIcon /></IconBtn>
          <IconBtn on={false} onClick={() => setSettingsOpen(true)} title="Cài đặt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </IconBtn>
        </div>

        {/* RIGHT — absolutely placed, never affects center */}
        <div style={{
          position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Timer — big, white, fixed-width to prevent layout shift */}
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#fff',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
            minWidth: 64, textAlign: 'right', display: 'inline-block',
          }}>
            {fmtTime(elapsed)}
          </span>

          <Divider />

          {/* Participants count — clickable */}
          <button onClick={() => togglePanel('participants')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            border: `1px solid ${panel === 'participants' ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0.18)'}`,
            background: panel === 'participants' ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.08)',
            cursor: 'pointer', color: '#A78BFA', transition: 'all 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{participants.length}</span>
          </button>

          <Divider />

          <LeaveButton
            isHost={isHost}
            leaving={leaving}
            ending={ending}
            onLeave={handleLeave}
            onEnd={handleEnd}
          />
        </div>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* Meeting ended overlay */}
      {roomEnded && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(6,8,16,0.92)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Be Vietnam Pro", sans-serif',
          animation: 'panelIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 0, textAlign: 'center', maxWidth: 360, padding: '0 24px',
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 20, marginBottom: 24,
              background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6B8A" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </div>

            <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              Cuộc họp đã kết thúc
            </h2>
            <p style={{ margin: '0 0 36px', fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              Chủ phòng đã kết thúc cuộc họp này.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button
                onClick={() => navigate(`/library/${meetingId}`)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 13, border: 'none',
                  background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Xem tóm tắt
              </button>

              <button
                onClick={() => navigate('/home', { replace: true })}
                style={{
                  width: '100%', padding: '13px', borderRadius: 13,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kicked overlay */}
      {wasKicked && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(6,8,16,0.92)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Be Vietnam Pro", sans-serif',
          animation: 'panelIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', maxWidth: 360, padding: '0 24px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, marginBottom: 24,
              background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="17" y1="11" x2="23" y2="11"/>
              </svg>
            </div>

            <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
              Bạn đã bị xóa khỏi phòng
            </h2>
            <p style={{ margin: '0 0 36px', fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              Chủ phòng đã xóa bạn khỏi cuộc họp này.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <button
                onClick={() => navigate(`/meeting/${roomCode}`, { replace: true })}
                style={{
                  width: '100%', padding: '14px', borderRadius: 13, border: 'none',
                  background: 'linear-gradient(135deg, #00C9B8, #009E8A)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(0,201,184,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                Tham gia lại
              </button>

              <button
                onClick={() => navigate('/home', { replace: true })}
                style={{
                  width: '100%', padding: '13px', borderRadius: 13,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes screenPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(0,201,184,0.3); }
          50%       { box-shadow: 0 0 0 5px rgba(0,201,184,0.12); }
        }
        @keyframes liveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}

/* ── Custom dynamic grid ────────────────────────────────────────────────── */
function MeetGrid({ mirrorCamera, localUser, userInfoMap }) {
  const [page, setPage] = useState(0)
  const [visible, setVisible] = useState(true)
  const [layoutKey, setLayoutKey] = useState(0)
  const allTracks = useTracks(
    [
      { source: Track.Source.Camera,      withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const screenTracks = allTracks.filter(t => t.source === Track.Source.ScreenShare)
  const cameraTracks = allTracks.filter(t => t.source === Track.Source.Camera)
  const hasScreen    = screenTracks.length > 0

  // Animate layout transitions
  const prevHasScreen = useRef(hasScreen)
  useEffect(() => {
    if (prevHasScreen.current === hasScreen) return
    prevHasScreen.current = hasScreen
    setVisible(false)
    const t = setTimeout(() => { setLayoutKey(k => k + 1); setVisible(true) }, 220)
    return () => clearTimeout(t)
  }, [hasScreen])

  /* ── Presentation layout ── */
  if (hasScreen) {
    const screenTrack = screenTracks[0]
    return (
      <div key={layoutKey} style={{ width: '100%', height: '100%', display: 'flex', background: '#060810', padding: PAD, gap: GAP, boxSizing: 'border-box', opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.98)', transition: 'opacity 0.22s ease, transform 0.22s ease' }}>

        {/* Main: screen share */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <ScreenShareTile track={screenTrack} />
        </div>

        {/* Right strip: camera thumbnails */}
        <div style={{
          width: 180, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: GAP,
          overflowY: 'auto',
        }}>
          {cameraTracks.map(track => (
            <div key={track.participant.identity} style={{ width: '100%', aspectRatio: '16/9', flexShrink: 0 }}>
              <MeetTile track={track} mirrorCamera={mirrorCamera} localUser={localUser} userInfoMap={userInfoMap} avatarSize={48} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Normal tiled layout with pagination ── */
  const totalPages  = Math.ceil(cameraTracks.length / PAGE_SIZE)
  const safePage    = Math.min(page, Math.max(0, totalPages - 1))
  const pageTracks  = cameraTracks.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const arrangement = getArrangement(Math.max(pageTracks.length, 1))
  const maxCols     = Math.max(...arrangement)
  const avatarSize  = maxCols === 1 ? 120 : maxCols === 2 ? 96 : maxCols === 3 ? 72 : 52

  return (
    <div key={layoutKey} style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#060810', boxSizing: 'border-box',
      position: 'relative',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.98)',
      transition: 'opacity 0.22s ease, transform 0.22s ease',
    }}>
      {/* Tiles */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: GAP, padding: PAD, minHeight: 0,
      }}>
        {arrangement.map((rowCount, rowIdx) => {
          const start     = arrangement.slice(0, rowIdx).reduce((a, b) => a + b, 0)
          const rowTracks = pageTracks.slice(start, start + rowCount)
          if (!rowTracks.length) return null

          return (
            <div key={rowIdx} style={{ flex: 1, display: 'flex', gap: GAP, justifyContent: 'center' }}>
              {rowTracks.map(track => (
                <div
                  key={track.participant.identity}
                  style={{
                    width: `calc((100% - ${(maxCols - 1) * GAP}px) / ${maxCols})`,
                    flexShrink: 0, height: '100%',
                  }}
                >
                  <MeetTile track={track} mirrorCamera={mirrorCamera} localUser={localUser} userInfoMap={userInfoMap} avatarSize={avatarSize} />
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Pagination controls — only when needed */}
      {totalPages > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 14px', borderRadius: 20,
          background: 'rgba(10,13,24,0.85)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5,
        }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: safePage === 0 ? 'transparent' : 'rgba(255,255,255,0.08)',
              color: safePage === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
              cursor: safePage === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', minWidth: 60, textAlign: 'center' }}>
            {safePage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: safePage === totalPages - 1 ? 'transparent' : 'rgba(255,255,255,0.08)',
              color: safePage === totalPages - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
              cursor: safePage === totalPages - 1 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Screen share tile ──────────────────────────────────────────────────── */
function ScreenShareTile({ track }) {
  const participant = track.participant
  const name        = participant.name || participant.identity || '?'

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 4, overflow: 'hidden', background: '#060810',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <VideoTrack
        trackRef={track}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
      {/* Presenter label — only show to others, not to the sharer */}
      {!participant.isLocal && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 10,
          background: 'rgba(6,8,16,0.8)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C9B8" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>đang chia sẻ màn hình</span>
        </div>
      )}
    </div>
  )
}

/* ── Participant tile ────────────────────────────────────────────────────── */
function MeetTile({ track, mirrorCamera, localUser, userInfoMap, avatarSize = 120 }) {
  const participant = track.participant
  const isVideoOn   = !!track.publication && !track.publication.isMuted
  const isSpeaking  = participant.isSpeaking
  const isMicOn     = participant.isMicrophoneEnabled
  const isLocal     = participant.isLocal

  const remoteInfo = userInfoMap?.[participant.identity] || {}
  const avatarUrl  = isLocal ? (localUser?.avatar_url || '') : (remoteInfo.avatar_url || '')
  const name       = participant.name || remoteInfo.display_name || participant.identity || '?'
  const label      = name + (isLocal ? ' (bạn)' : '')

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 4, overflow: 'hidden',
      background: '#111525',
      border: `2px solid ${isSpeaking ? '#00C9B8' : 'rgba(255,255,255,0.06)'}`,
      boxShadow: isSpeaking ? '0 0 0 3px rgba(0,201,184,0.18)' : '0 2px 12px rgba(0,0,0,0.45)',
      transition: 'border-color 0.18s, box-shadow 0.18s',
    }}>

      {/* Video */}
      {isVideoOn && (
        <VideoTrack
          trackRef={track}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            transform: isLocal && mirrorCamera ? 'scaleX(-1)' : 'none',
          }}
        />
      )}

      {/* Camera-off: big centered avatar */}
      {!isVideoOn && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#111525',
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -24, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,201,184,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <UserAvatar name={name} avatarUrl={avatarUrl} size={avatarSize} />
          </div>
        </div>
      )}

      {/* Name + mic bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '24px 10px 8px',
        background: 'linear-gradient(to top, rgba(6,8,16,0.82) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {!isMicOn && (
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            background: 'rgba(255,69,69,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MicIcon on={false} size={11} color="#FF5555" />
          </div>
        )}
        <span style={{
          fontSize: 15, fontWeight: 700, color: '#fff',
          textShadow: '0 1px 6px rgba(0,0,0,0.95)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {label}
        </span>
      </div>
    </div>
  )
}

/* ── Participants panel ─────────────────────────────────────────────────── */
function ParticipantsPanel({ participants, userInfoMap, localUser, isHost, meetingId, accessToken }) {
  const [query, setQuery] = useState('')

  const normalize = (str) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

  const filtered = participants.filter(p => {
    const name = p.name || userInfoMap?.[p.identity]?.display_name || p.identity || ''
    return normalize(name).includes(normalize(query))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm thành viên…"
          style={{
            width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,201,184,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>

      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
        {filtered.length} / {participants.length} thành viên
      </p>

      {filtered.map(p => {
        const remoteInfo = userInfoMap?.[p.identity] || {}
        const avatarUrl  = p.isLocal ? (localUser?.avatar_url || '') : (remoteInfo.avatar_url || '')
        const name       = p.name || remoteInfo.display_name || p.identity || '?'
        return (
          <div key={p.identity} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <UserAvatar name={name} avatarUrl={avatarUrl} size={34} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
            {p.isSpeaking && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C9B8', flexShrink: 0 }} />
            )}
            {!p.isMicrophoneEnabled && (
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,69,69,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MicIcon on={false} size={11} color="#FF5555" />
              </div>
            )}
            {isHost && !p.isLocal && (
              <KickBtn participantId={p.identity} meetingId={meetingId} accessToken={accessToken} name={name} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Kick button ────────────────────────────────────────────────────────── */
function KickBtn({ participantId, meetingId, accessToken, name }) {
  const [hovered, setHovered]     = useState(false)
  const [confirm, setConfirm]     = useState(false)
  const [kicking, setKicking]     = useState(false)

  async function handleKick() {
    if (kicking) return
    setKicking(true)
    setConfirm(false)
    try {
      await meetingsApi.kick(meetingId, participantId, accessToken)
    } catch {}
    finally { setKicking(false) }
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        disabled={kicking}
        title="Xóa khỏi phòng"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 26, height: 26, borderRadius: 7, border: 'none', flexShrink: 0,
          background: hovered ? '#FF3B3B' : 'rgba(255,69,69,0.08)',
          color: hovered ? '#fff' : 'rgba(255,100,100,0.5)',
          cursor: kicking ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: kicking ? 0.4 : 1,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="17" y1="11" x2="23" y2="11"/>
        </svg>
      </button>

      {confirm && (
        <div
          onClick={() => setConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Be Vietnam Pro", sans-serif',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 320, background: '#0F1220', borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              padding: '24px 24px 20px',
              animation: 'dropUp 0.18s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, marginBottom: 16,
              background: 'rgba(255,69,69,0.1)', border: '1px solid rgba(255,69,69,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5555" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="17" y1="11" x2="23" y2="11"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              Xóa khỏi phòng?
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{name}</strong> sẽ bị xóa khỏi cuộc họp này ngay lập tức.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Huỷ</button>
              <button
                onClick={handleKick}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                  background: '#FF3B3B', color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(255,59,59,0.35)',
                }}
              >Xóa</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Coming soon panel ──────────────────────────────────────────────────── */
function ComingSoonPanel({ label, phase }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, textAlign: 'center', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.16)' }}>Sắp ra mắt · {phase}</p>
      </div>
    </div>
  )
}

/* ── Leave / End dropdown button ────────────────────────────────────────── */
function LeaveButton({ isHost, leaving, ending, onLeave, onEnd }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const busy = leaving || ending

  // Non-host: plain X button, no dropdown
  if (!isHost) {
    return (
      <button
        onClick={onLeave}
        disabled={leaving}
        title="Rời phòng"
        style={{
          width: 42, height: 42, borderRadius: 12, border: 'none',
          background: leaving ? 'rgba(255,255,255,0.06)' : 'rgba(15,18,32,0.95)',
          border: '1px solid rgba(255,69,69,0.3)',
          color: leaving ? 'rgba(255,255,255,0.3)' : '#FF5555',
          cursor: leaving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => { if (!leaving) { e.currentTarget.style.background = '#FF3B3B'; e.currentTarget.style.borderColor = '#FF3B3B'; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,18,32,0.95)'; e.currentTarget.style.borderColor = 'rgba(255,69,69,0.3)'; e.currentTarget.style.color = '#FF5555' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        title="Rời / Kết thúc"
        style={{
          width: 42, height: 42, borderRadius: 12, border: 'none',
          background: open ? '#FF3B3B' : (busy ? 'rgba(255,255,255,0.06)' : 'rgba(15,18,32,0.95)'),
          border: `1px solid ${open ? '#FF3B3B' : 'rgba(255,69,69,0.3)'}`,
          color: open ? '#fff' : (busy ? 'rgba(255,255,255,0.3)' : '#FF5555'),
          cursor: busy ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          boxShadow: open ? '0 4px 14px rgba(255,59,59,0.4)' : '0 2px 10px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = '#FF3B3B'; e.currentTarget.style.borderColor = '#FF3B3B'; e.currentTarget.style.color = '#fff' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(15,18,32,0.95)'; e.currentTarget.style.borderColor = 'rgba(255,69,69,0.3)'; e.currentTarget.style.color = '#FF5555' } }}
      >
        {busy ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ animation: 'spin 0.7s linear infinite' }}>
            <path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', right: 0,
          background: '#0F1220', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 12, overflow: 'hidden', minWidth: 200,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          animation: 'dropUp 0.15s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Leave option — always shown */}
          <DropItem
            onClick={() => { setOpen(false); onLeave() }}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            }
            label="Rời phòng"
            sub="Cuộc họp vẫn tiếp tục"
            color="rgba(255,255,255,0.75)"
          />

          {/* End option — host only */}
          {isHost && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />
              <DropItem
                onClick={() => { setOpen(false); onEnd() }}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                }
                label="Kết thúc cuộc họp"
                sub="Tất cả thành viên sẽ bị ngắt"
                color="#FF6B8A"
              />
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dropUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function DropItem({ onClick, icon, label, sub, color }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '12px 16px', border: 'none', textAlign: 'left',
        background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{ color, display: 'flex', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  )
}

/* ── Bottom bar helpers ──────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)', margin: '0 4px', flexShrink: 0 }} />
}

/* ── Screen share button ────────────────────────────────────────────────── */
function ScreenShareBtn({ active, disabled, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={disabled ? 'Người khác đang chia sẻ' : active ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
        style={{
          width: 52, height: 52, borderRadius: 14, border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          opacity: disabled ? 0.35 : 1,
          background: active
            ? (hovered ? '#007A6C' : '#00A896')
            : (hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'),
          color: active ? '#fff' : 'rgba(255,255,255,0.7)',
          boxShadow: active ? '0 0 0 3px rgba(0,201,184,0.3)' : 'none',
          animation: active ? 'screenPulse 2s ease-in-out infinite' : 'none',
        }}
      >
        <ScreenIcon on={active} size={20} />
      </button>

    </div>
  )
}

function IconBtn({ children, on, onClick, offRed, disabled, title }) {
  const [hovered, setHovered] = useState(false)
  const isOff = offRed && !on
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        width: 52, height: 52, borderRadius: 14, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        opacity: disabled ? 0.35 : 1,
        background: isOff
          ? (hovered ? 'rgba(255,69,69,0.28)' : 'rgba(255,69,69,0.16)')
          : on
            ? (hovered ? 'rgba(0,201,184,0.28)' : 'rgba(0,201,184,0.15)')
            : (hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'),
        color: isOff ? '#FF5555' : on ? '#00C9B8' : 'rgba(255,255,255,0.7)',
        boxShadow: on && !offRed ? '0 0 0 1px rgba(0,201,184,0.2)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function MicIcon({ on, size = 18, color }) {
  const s = color || 'currentColor'
  return on ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/>
    </svg>
  )
}
function CamIcon({ on, size = 18 }) {
  return on ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M21 21H3a2 2 0 01-2-2V8m3-3h7l2 3h4a2 2 0 012 2v9.34M16 16l7 4V7"/>
    </svg>
  )
}
function ScreenIcon({ on, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}
function CaptionIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 13h4M7 9h10"/>
    </svg>
  )
}
function TtsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
      <path d="M19.07 4.93a10 10 0 010 14.14"/>
    </svg>
  )
}
function ChatIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}
