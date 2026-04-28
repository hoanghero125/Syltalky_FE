import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import useStore from '../store'
import UserAvatar from '../components/UserAvatar'

/* ─── Scroll-reveal hook ─── */
function useReveal(containerRef) {
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const els = root.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { root, threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [containerRef])
}

/* ─── Waveform SVG ─── */
function WaveRings({ size = 420 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 420 420" fill="none" style={{ display: 'block' }}>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-rev  { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .spin-cw  { animation: spin-slow 18s linear infinite; transform-origin: 210px 210px; }
        .spin-ccw { animation: spin-rev  24s linear infinite; transform-origin: 210px 210px; }
      `}</style>
      <circle cx="210" cy="210" r="190" stroke="rgba(0,212,192,0.07)" strokeWidth="1"/>
      <circle cx="210" cy="210" r="155" stroke="rgba(0,212,192,0.10)" strokeWidth="1"/>
      <circle className="spin-cw"  cx="210" cy="210" r="140" stroke="rgba(0,212,192,0.18)" strokeWidth="1.5" strokeDasharray="12 8"/>
      <circle className="spin-ccw" cx="210" cy="210" r="108" stroke="rgba(0,212,192,0.22)" strokeWidth="1"   strokeDasharray="6 10"/>
      <circle cx="210" cy="210" r="72" fill="rgba(0,212,192,0.06)" stroke="rgba(0,212,192,0.3)" strokeWidth="1.5"/>
      <circle cx="210" cy="210" r="46" fill="rgba(0,212,192,0.10)" stroke="rgba(0,212,192,0.5)" strokeWidth="2"/>
      <circle cx="210" cy="210" r="22" fill="rgba(0,212,192,0.25)"/>
      <circle cx="210" cy="210" r="10" fill="#00D4C0"/>
      {Array.from({length: 32}).map((_, i) => {
        const a = (i / 32) * Math.PI * 2
        const r1 = 184, r2 = i % 4 === 0 ? 170 : 178
        return <line key={i} x1={210+r1*Math.cos(a)} y1={210+r1*Math.sin(a)} x2={210+r2*Math.cos(a)} y2={210+r2*Math.sin(a)} stroke="rgba(0,212,192,0.35)" strokeWidth={i%4===0?1.5:0.8}/>
      })}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = deg * Math.PI / 180
        const h = [28,18,34,22,30,16,26,20][i]
        return <line key={deg} x1={210+55*Math.cos(rad)} y1={210+55*Math.sin(rad)} x2={210+(55+h)*Math.cos(rad)} y2={210+(55+h)*Math.sin(rad)} stroke="#00D4C0" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      })}
      {[[50,80],[370,100],[30,340],[390,290],[200,30],[210,400],[100,200],[330,210]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2" fill="#00D4C0" opacity="0.4"/>
      ))}
    </svg>
  )
}

/* ─── Animated bar waveform ─── */
function BarWave({ count = 10, height = 16 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height }}>
      {Array.from({length: count}).map((_, i) => (
        <div key={i} style={{
          width: 2.5, height: '100%', borderRadius: 2,
          background: 'linear-gradient(to top, #00D4C0, rgba(0,212,192,0.3))',
          transformOrigin: 'center',
          animation: `lp-bar ${0.6 + (i % 7) * 0.12}s ease-in-out infinite`,
          animationDelay: `${i * 0.05}s`,
        }}/>
      ))}
    </div>
  )
}

const FEATURES = [
  { num: '01', title: 'Phụ đề trực tiếp',   desc: 'Mỗi người nói được nhận diện riêng — phụ đề xuất hiện theo thời gian thực, không bỏ lỡ một chữ nào.', accent: '#00D4C0' },
  { num: '02', title: 'Nhân bản giọng nói',  desc: 'Upload 15 giây giọng nói của bạn — AI tái tạo chính xác giọng đó để phát biểu thay bạn trong cuộc họp.', accent: '#A78BFA' },
  { num: '03', title: 'Ngôn ngữ ký hiệu',    desc: 'Dùng camera ký hiệu — AI dịch và chuyển thành giọng nói, phát trực tiếp cho mọi người.', accent: '#FB923C' },
  { num: '04', title: 'Tóm tắt thông minh',  desc: 'Sau mỗi cuộc họp, AI tự động tóm tắt nội dung theo từng người nói. Không bỏ lỡ điều gì.', accent: '#34D399' },
]

const TEAM = [
  { name: 'Thành viên 1', role: 'Vai trò', color: '#00D4C0' },
  { name: 'Thành viên 2', role: 'Vai trò', color: '#A78BFA' },
  { name: 'Thành viên 3', role: 'Vai trò', color: '#FB923C' },
  { name: 'Thành viên 4', role: 'Vai trò', color: '#34D399' },
]

const STATS = [
  { value: '<200ms', label: 'Độ trễ phụ đề' },
  { value: '4+',     label: 'Ngôn ngữ hỗ trợ' },
  { value: '99%',    label: 'Độ chính xác STT' },
  { value: '0',      label: 'Plugin cần cài' },
]

export default function LandingPage() {
  const containerRef = useRef(null)
  const [scrolled, setScrolled]   = useState(false)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const navigate = useNavigate()
  const { user, accessToken } = useStore()
  const isLoggedIn = !!accessToken

  /* Attach scroll to the container div, not window */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 40)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  /* Scroll-reveal for below-fold sections */
  useReveal(containerRef)

  /* Smooth scroll helper — offsets for the sticky navbar height */
  const scrollTo = useCallback((id) => {
    const container = containerRef.current
    const target = container?.querySelector(`#${id}`)
    if (!container || !target) return
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 72
    container.scrollTo({ top: offset, behavior: 'smooth' })
  }, [])

  const gx = (mousePos.x / (window.innerWidth  || 1) - 0.5) * 30
  const gy = (mousePos.y / (window.innerHeight || 1) - 0.5) * 30

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%', overflowY: 'auto', overflowX: 'hidden',
        background: '#050810', color: '#E2E8F5',
        fontFamily: '"Be Vietnam Pro", sans-serif',
        scrollBehavior: 'smooth',
      }}
    >
      <style>{`
        @keyframes lp-bar {
          0%, 100% { transform: scaleY(0.2); }
          50%       { transform: scaleY(1); }
        }
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Hero entrance */
        .h-tag  { animation: lp-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.05s; }
        .h-h1   { animation: lp-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.18s; }
        .h-sub  { animation: lp-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.32s; }
        .h-cta  { animation: lp-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.46s; }
        .h-trust{ animation: lp-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.58s; }
        .h-ring { animation: lp-fade-in  1.1s ease both; animation-delay: 0.2s; }

        /* Scroll-reveal */
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.08s; }
        .reveal-delay-2 { transition-delay: 0.16s; }
        .reveal-delay-3 { transition-delay: 0.24s; }
        .reveal-delay-4 { transition-delay: 0.32s; }

        /* Interactions */
        .lp-btn-teal:hover  { opacity: 0.87; transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,212,192,0.48) !important; }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.09) !important; transform: translateY(-2px); }
        .feat-card { transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease; }
        .feat-card:hover { transform: translateY(-5px) !important; border-color: rgba(255,255,255,0.16) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .nav-btn:hover { color: #fff !important; }
        .stat-cell { border-right: 1px solid rgba(255,255,255,0.07); }
        .stat-cell:last-child { border-right: none; }
      `}</style>

      {/* ════ NAVBAR ════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(5,8,16,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
        boxShadow: scrolled ? '0 1px 32px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 52px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <button onClick={() => scrollTo('features')} className="nav-btn" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.42)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0, fontFamily: 'inherit' }}>Tính năng</button>
            <button onClick={() => scrollTo('stats')}    className="nav-btn" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.42)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0, fontFamily: 'inherit' }}>Về chúng tôi</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoggedIn ? (
              <>
                <button onClick={() => navigate('/home')} className="lp-btn-teal" style={{
                  padding: '8px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: '#00D4C0', color: '#050810', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,212,192,0.28)', transition: 'all 0.22s',
                  fontFamily: '"Be Vietnam Pro", sans-serif',
                }}>
                  Vào ứng dụng →
                </button>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                  padding: '5px 12px 5px 6px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <UserAvatar name={user?.display_name} avatarUrl={user?.avatar_url} size={24} />
                  {user?.display_name}
                </span>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn" style={{ padding: '8px 18px', borderRadius: 8, color: 'rgba(255,255,255,0.48)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="lp-btn-teal" style={{
                  padding: '8px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: '#00D4C0', color: '#050810', textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0,212,192,0.28)', transition: 'all 0.22s', display: 'inline-block',
                }}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ════ HERO ════ */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', gap: 60,
        padding: '60px 52px 80px',
        maxWidth: 1280, margin: '0 auto',
        position: 'relative',
      }}>
        {/* Parallax glow */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(ellipse 55% 50% at ${50 + gx * 0.35}% ${42 + gy * 0.35}%, rgba(0,212,192,0.065) 0%, transparent 68%)`,
          transition: 'background 0.08s linear',
        }}/>
        <div style={{ position: 'absolute', top: '10%', right: '2%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.055) 0%, transparent 65%)', pointerEvents: 'none' }}/>

        {/* Left — copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="h-tag" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 30,
            border: '1px solid rgba(0,212,192,0.28)', borderRadius: 5,
            padding: '5px 14px 5px 8px', background: 'rgba(0,212,192,0.055)',
          }}>
            <BarWave count={10} height={15}/>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#00D4C0' }}>
              AI · Thời gian thực · Bao gồm tất cả
            </span>
          </div>

          <h1 className="h-h1" style={{
            fontSize: 'clamp(42px, 5.2vw, 74px)', fontWeight: 800,
            lineHeight: 1.07, letterSpacing: '-2.5px', margin: '0 0 28px', color: '#fff',
          }}>
            Mọi giọng nói<br/>
            <span style={{ display: 'inline-block', marginTop: 10 }}>
              <span style={{ color: '#00D4C0' }}>đều</span>
              <span style={{ color: 'rgba(255,255,255,0.13)', fontWeight: 200 }}> được</span>
            </span><br/>
            <em style={{ fontWeight: 200, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', fontSize: '0.8em', letterSpacing: '-1px' }}>lắng nghe.</em>
          </h1>

          <p className="h-sub" style={{
            fontSize: 15.5, lineHeight: 1.78, fontWeight: 400,
            color: 'rgba(255,255,255,0.4)', maxWidth: 410, margin: '0 0 44px',
          }}>
            Nền tảng họp trực tuyến với phụ đề AI theo từng người nói, nhân bản giọng nói, dịch ngôn ngữ ký hiệu và tóm tắt cuộc họp tự động.
          </p>

          <div className="h-cta" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <button onClick={() => navigate('/home')} className="lp-btn-teal" style={{
                padding: '13px 34px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                background: '#00D4C0', color: '#050810', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,212,192,0.38)', transition: 'all 0.22s',
                fontFamily: '"Be Vietnam Pro", sans-serif',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                Vào ứng dụng
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            ) : (
              <>
                <Link to="/register" className="lp-btn-teal" style={{
                  padding: '13px 30px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  background: '#00D4C0', color: '#050810', textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(0,212,192,0.38)', transition: 'all 0.22s', display: 'inline-block',
                }}>
                  Tạo tài khoản miễn phí
                </Link>
                <Link to="/login" className="lp-btn-ghost" style={{
                  padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.11)', color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none', background: 'rgba(255,255,255,0.035)', transition: 'all 0.22s',
                }}>
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

        </div>

        {/* Right — ring */}
        <div className="h-ring" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            transform: `perspective(900px) rotateX(${gy * 0.025}rad) rotateY(${gx * 0.025}rad)`,
            transition: 'transform 0.15s ease',
          }}>
            <WaveRings size={460}/>
          </div>

          {/* Floating cards */}
          <div style={{
            position: 'absolute', top: '12%', left: '-6%',
            background: 'rgba(8,12,22,0.94)', border: '1px solid rgba(0,212,192,0.22)',
            borderRadius: 12, padding: '10px 15px', backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 10, color: '#00D4C0', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>● LIVE CAPTION</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Hoàngg Đỗ đang nói...</div>
          </div>

          <div style={{
            position: 'absolute', bottom: '16%', right: '-4%',
            background: 'rgba(8,12,22,0.94)', border: '1px solid rgba(167,139,250,0.22)',
            borderRadius: 12, padding: '10px 15px', backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 10, color: '#A78BFA', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 3 }}>◈ VOICE CLONED</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Giọng của Hoàngg Đỗ · AI</div>
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} className={`stat-cell reveal reveal-delay-${i+1}`} style={{ padding: '44px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(26px,3.2vw,42px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ marginTop: 9, fontSize: 13, color: 'rgba(255,255,255,0.32)', fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════ FEATURES ════ */}
      <section id="features" style={{ padding: '120px 52px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="reveal" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#00D4C0', textTransform: 'uppercase', marginBottom: 14 }}>— Tính năng</div>
            <h2 style={{ fontSize: 'clamp(28px,3.2vw,46px)', fontWeight: 800, letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1, color: '#fff', maxWidth: 420 }}>
              AI tích hợp sâu<br/>trong mọi cuộc họp
            </h2>
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.33)', maxWidth: 300, lineHeight: 1.72, margin: 0 }}>
            AI là trung tâm của mọi trải nghiệm.
          </p>
        </div>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FeatureCard f={FEATURES[0]} style={{ gridColumn: '1 / 3' }} delay={1}/>
          <FeatureCard f={FEATURES[1]} style={{ gridColumn: '3 / 4' }} delay={2}/>
          <FeatureCard f={FEATURES[2]} style={{ gridColumn: '1 / 2' }} delay={1}/>
          <FeatureCard f={FEATURES[3]} style={{ gridColumn: '2 / 4' }} delay={2}/>
        </div>
      </section>

      {/* ════ TEAM ════ */}
      <section id="stats" style={{ padding: '120px 52px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="reveal" style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#A78BFA', textTransform: 'uppercase', marginBottom: 14 }}>— Về chúng tôi</div>
          <h2 style={{ fontSize: 'clamp(28px,3.2vw,46px)', fontWeight: 800, letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1, color: '#fff' }}>
            Đội ngũ đằng sau<br/>
            <em style={{ fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>Syltalky</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {TEAM.map((m, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{
              background: 'rgba(255,255,255,0.022)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, overflow: 'hidden',
              transition: 'transform 0.28s ease, border-color 0.28s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${m.color}44` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              {/* Avatar area */}
              <div style={{
                width: '100%', aspectRatio: '1 / 1',
                background: `radial-gradient(ellipse at 50% 80%, ${m.color}18 0%, transparent 70%), linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="9" r="5" fill={m.color} opacity="0.2"/>
                  <circle cx="12" cy="9" r="5" stroke={m.color} strokeWidth="1.2" opacity="0.4"/>
                  <path d="M3 21c0-5 4-8.5 9-8.5s9 3.5 9 8.5" stroke={m.color} strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
                </svg>
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 10px ${m.color}` }}/>
              </div>

              {/* Info */}
              <div style={{ padding: '20px 22px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: m.color, textTransform: 'uppercase', marginBottom: 6 }}>
                  {m.role}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                  {m.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section style={{ padding: '0 52px 140px', maxWidth: 1280, margin: '0 auto' }}>
        <div className="reveal" style={{
          position: 'relative', overflow: 'hidden', borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(0,212,192,0.075) 0%, rgba(167,139,250,0.055) 100%)',
          border: '1px solid rgba(0,212,192,0.16)',
          padding: '80px 64px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 60, alignItems: 'center',
        }}>
          <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,192,0.07) 0%, transparent 65%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', left: '38%', bottom: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.055) 0%, transparent 65%)', pointerEvents: 'none' }}/>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#A78BFA', textTransform: 'uppercase', marginBottom: 20 }}>— Sẵn sàng bắt đầu?</div>
            <h2 style={{ fontSize: 'clamp(26px,2.8vw,42px)', fontWeight: 800, letterSpacing: '-1.2px', margin: '0 0 14px', color: '#fff', lineHeight: 1.15 }}>
              Cuộc họp đầu tiên của bạn<br/>
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>chỉ cách một cú click.</em>
            </h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.68 }}>
              Tạo tài khoản miễn phí, không cần thẻ tín dụng.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
            {isLoggedIn ? (
              <button onClick={() => navigate('/home')} className="lp-btn-teal" style={{
                padding: '14px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: '#00D4C0', color: '#050810', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,212,192,0.32)', transition: 'all 0.22s',
                textAlign: 'center', whiteSpace: 'nowrap', fontFamily: '"Be Vietnam Pro", sans-serif',
              }}>
                Vào ứng dụng →
              </button>
            ) : (
              <>
                <Link to="/register" className="lp-btn-teal" style={{
                  padding: '14px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  background: '#00D4C0', color: '#050810', textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(0,212,192,0.32)', transition: 'all 0.22s',
                  textAlign: 'center', display: 'block', whiteSpace: 'nowrap',
                }}>
                  Tạo tài khoản miễn phí
                </Link>
                <Link to="/login" style={{
                  textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)',
                  textDecoration: 'none', transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  Đã có tài khoản? Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 52px', maxWidth: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0 }}>© 2026 Syltalky. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ f, style = {}, delay = 0 }) {
  return (
    <div className={`feat-card reveal${delay ? ` reveal-delay-${delay}` : ''}`} style={{
      background: 'rgba(255,255,255,0.022)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, padding: '36px 36px 40px', cursor: 'default',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: f.accent }}>{f.num}</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.accent, boxShadow: `0 0 10px ${f.accent}`, marginTop: 3 }}/>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 13px', letterSpacing: '-0.4px' }}>{f.title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.74, margin: 0 }}>{f.desc}</p>
      <div style={{ marginTop: 28, height: 2, width: 40, background: f.accent, borderRadius: 2, opacity: 0.45 }}/>
    </div>
  )
}

function Logo() {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
      {!imgFailed
        ? <img src="/images/full_logo_transparent.png" alt="Syltalky"
            style={{ height: 46, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={() => setImgFailed(true)}
          />
        : <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.6px' }}>
            Syl<span style={{ color: '#00D4C0' }}>talky</span>
          </span>
      }
    </Link>
  )
}
