import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import useStore from '../store'
import { meetingsApi } from '../api/meetings'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDuration(start, end) {
  if (!start || !end) return '—'
  const m = Math.floor((new Date(end) - new Date(start)) / 60000)
  if (m < 1) return '< 1 phút'
  if (m < 60) return `${m} phút`
  return `${Math.floor(m / 60)}g ${m % 60}p`
}

function fmtTime(ms) {
  const d = new Date(ms)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function MeetingDetailScreen() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useStore()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('summary')

  useEffect(() => {
    let cancelled = false
    let timer = null

    async function fetchMeeting() {
      try {
        const data = await meetingsApi.get(meetingId, accessToken)
        if (cancelled) return
        setMeeting(data)
        setLoading(false)
        // Poll until summary arrives; stop early if meeting ended with < 5 transcript entries
        const transcriptLen = data.transcript?.length ?? 0
        const tooShort = !!data.ended_at && transcriptLen < 5
        if (!data.summary && !tooShort) {
          timer = setTimeout(fetchMeeting, 4000)
        }
      } catch {
        if (!cancelled) navigate('/library', { replace: true })
      }
    }

    fetchMeeting()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [meetingId, accessToken])

  if (loading) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#07090F', fontFamily: '"Be Vietnam Pro", sans-serif',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,201,184,0.6)" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'spin 0.7s linear infinite' }}>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
      </div>
    )
  }

  if (!meeting) return null

  const transcript = meeting.transcript || []
  const summary = meeting.summary || ''
  const summaryTooShort = !!meeting.ended_at && transcript.length < 5 && !summary

  return (
    <div style={{
      flex: 1, height: '100%', overflowY: tab === 'chat' ? 'hidden' : 'auto',
      fontFamily: '"Be Vietnam Pro", sans-serif', color: '#E8EAF0',
      background: '#07090F',
    }}>
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: 240, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 50% 40% at 60% 15%, rgba(167,139,250,0.055) 0%, transparent 65%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        padding: '44px 52px 0', maxWidth: 960, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        height: tab === 'chat' ? '100%' : 'auto', boxSizing: 'border-box',
      }}>

        {/* Back */}
        <button onClick={() => navigate('/library')} style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 32,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Thư viện
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>
              {meeting.room_code}
            </h1>
            {summary && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Đã tóm tắt
              </span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {[
              { icon: 'user', label: meeting.host_name || '—' },
              { icon: 'calendar', label: fmtDate(meeting.started_at) },
              { icon: 'clock', label: fmtDuration(meeting.started_at, meeting.ended_at) },
              { icon: 'message', label: `${transcript.length} lượt phát biểu` },
            ].map(({ icon, label }) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MetaIcon type={icon} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4,
          width: 'fit-content',
        }}>
          {[
            { key: 'summary', label: 'Tóm tắt AI', color: '#A78BFA', bg: 'rgba(167,139,250,0.2)' },
            { key: 'chat', label: 'Hỏi đáp', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
            { key: 'transcript', label: `Bản ghi (${transcript.length})`, color: '#00C9B8', bg: 'rgba(0,201,184,0.15)' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t.key ? t.bg : 'transparent',
              color: tab === t.key ? t.color : 'rgba(255,255,255,0.35)',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Summary tab */}
        {tab === 'summary' && (
          <div style={{ animation: 'tabIn 0.2s ease', paddingBottom: 80 }}>
            {summaryTooShort ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 18,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.22)', margin: '0 0 6px' }}>
                    Nội dung quá ngắn để tóm tắt
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', margin: 0 }}>
                    Cuộc họp cần có ít nhất 5 lượt phát biểu để AI tạo tóm tắt.
                  </p>
                </div>
              </div>
            ) : !summary ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 18,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"
                  style={{ animation: 'spin 1.2s linear infinite' }}>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.22)', margin: '0 0 6px' }}>
                    Đang tạo tóm tắt…
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', margin: 0 }}>
                    AI đang xử lý bản ghi cuộc họp, vui lòng quay lại sau.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.12)',
                borderRadius: 18, padding: '28px 32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    AI · Tóm tắt cuộc họp
                  </span>
                </div>
                <div style={{ lineHeight: 1.75 }} className="ai-summary-md">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript tab */}
        {tab === 'transcript' && (
          <div style={{ animation: 'tabIn 0.2s ease', paddingBottom: 80 }}>
            {transcript.length === 0 ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 18,
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.22)', margin: 0 }}>
                  Không có bản ghi
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {transcript.map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, padding: '10px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0, paddingTop: 3, minWidth: 64 }}>
                      {fmtTime(entry.timestamp)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00C9B8', marginRight: 8 }}>
                        {entry.display_name}
                      </span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                        {entry.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat tab */}
        {tab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 24 }}>
            <MeetingChat meetingId={meetingId} accessToken={accessToken} hasSummary={!!summary} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes tabIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes msgIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

const SUGGESTIONS = [
  'Ai đã tham gia cuộc họp này?',
  'Những quyết định nào đã được đưa ra?',
  'Các hành động cần thực hiện sau cuộc họp?',
  'Vấn đề chính được thảo luận là gì?',
]

function MeetingChat({ meetingId, accessToken, hasSummary }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    meetingsApi.chatHistory(meetingId, accessToken)
      .then(data => { if (data.history?.length) setMessages(data.history) })
      .catch(() => {})
  }, [meetingId, accessToken])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(q = input.trim()) {
    if (!q || loading) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const history = [...messages, userMsg]
      const data = await meetingsApi.ask(meetingId, q, history, accessToken)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Lỗi: ${e.message}` }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!hasSummary) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
      background: 'rgba(255,255,255,0.015)', animation: 'tabIn 0.2s ease',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, margin: '0 auto 14px',
          background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.22)', margin: '0 0 6px' }}>Hỏi đáp chưa sẵn sàng</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.12)', margin: 0 }}>Vui lòng chờ tóm tắt cuộc họp hoàn thành trước.</p>
      </div>
    </div>
  )

  const isEmpty = messages.length === 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(96,165,250,0.12)',
      background: 'rgba(255,255,255,0.015)',
      animation: 'tabIn 0.2s ease',
    }}>

      {/* Header bar */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(96,165,250,0.04)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Hỏi đáp</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(96,165,250,0.6)', fontWeight: 500 }}>
            AI · dựa trên nội dung cuộc họp
          </span>
        </div>
      </div>

      {/* Scrollable messages area */}
      <div ref={scrollAreaRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px 20px 4px',
        display: 'flex', flexDirection: 'column',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>

        {/* Empty state — centered inside scroll area */}
        {isEmpty && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 16,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.05))',
                border: '1px solid rgba(96,165,250,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '-0.3px' }}>
                Hỏi về cuộc họp này
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>
                AI trả lời dựa trên toàn bộ nội dung cuộc họp
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{
                    padding: '8px 14px', borderRadius: 20,
                    background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)',
                    color: 'rgba(96,165,250,0.8)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.14)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.color = '#93C5FD' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.07)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)'; e.currentTarget.style.color = 'rgba(96,165,250,0.8)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages list */}
        {!isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start', gap: 10,
                animation: 'msgIn 0.22s cubic-bezier(0.22,1,0.36,1)',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, rgba(96,165,250,0.25), rgba(96,165,250,0.1))'
                    : 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.08))',
                  border: `1px solid ${m.role === 'user' ? 'rgba(96,165,250,0.3)' : 'rgba(167,139,250,0.25)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.role === 'user' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                  )}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '76%',
                  padding: m.role === 'user' ? '10px 15px' : '12px 16px',
                  borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(96,165,250,0.08))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(96,165,250,0.22)' : 'rgba(255,255,255,0.08)'}`,
                  fontSize: 13.5, lineHeight: 1.65, fontFamily: 'inherit',
                  color: m.role === 'user' ? '#BAD8FD' : 'rgba(255,255,255,0.82)',
                }}>
                  {m.role === 'assistant'
                    ? <div className="ai-summary-md" style={{ margin: 0 }}><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    : m.content
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'msgIn 0.22s ease' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.08))',
                  border: '1px solid rgba(167,139,250,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                  </svg>
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'rgba(167,139,250,0.6)',
                      animation: `typingDot 1.4s ${i * 0.16}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input area — pinned at bottom */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${focused ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.06)'}`,
        background: focused ? 'rgba(96,165,250,0.03)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 14px 12px 16px' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Nhập câu hỏi về cuộc họp…"
            rows={1}
            style={{
              flex: 1, padding: '9px 12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, outline: 'none', resize: 'none',
              color: '#fff', fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.55,
              maxHeight: 120, overflowY: 'auto', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => { e.target.style.borderColor = 'rgba(96,165,250,0.3)' }}
            onBlurCapture={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{
              flexShrink: 0, width: 38, height: 38, borderRadius: 11, border: 'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #60A5FA, #3B82F6)'
                : 'rgba(255,255,255,0.06)',
              color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.18)',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              boxShadow: input.trim() && !loading ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {loading ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.12)' }}>
            Enter để gửi · Shift+Enter xuống dòng
          </span>
        </div>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function MetaIcon({ type }) {
  const stroke = 'rgba(255,255,255,0.3)'
  const props = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: '2', strokeLinecap: 'round' }
  if (type === 'user') return <svg {...props}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  if (type === 'calendar') return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (type === 'clock') return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  if (type === 'message') return <svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  return null
}
