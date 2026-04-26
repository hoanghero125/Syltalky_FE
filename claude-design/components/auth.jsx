// Auth — bold redesign: full-bleed split layout
const { useState: useStAuth } = React;

/* ── Shared field ── */
function Field({ label, type, value, onChange, placeholder, error, autoFocus }) {
  const [show, setShow] = useStAuth(false);
  const isPass = type === 'password';
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)',
        letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8,
        fontFamily:'Poppins,sans-serif',
      }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input
          autoFocus={autoFocus}
          type={isPass && !show ? 'password' : 'text'}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width:'100%', padding: isPass ? '13px 42px 13px 0' : '13px 0',
            background:'transparent', border:'none', borderBottom:`1.5px solid ${error ? '#F87171' : 'rgba(255,255,255,0.2)'}`,
            color:'#fff', fontSize:15, fontFamily:'Poppins,sans-serif', outline:'none',
            transition:'border-color 0.2s', boxSizing:'border-box',
          }}
          onFocus={e => { if(!error) e.target.style.borderBottomColor = '#00C9B8'; }}
          onBlur={e  => { if(!error) e.target.style.borderBottomColor = 'rgba(255,255,255,0.2)'; }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s=>!s)} style={{
            position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:4,
          }}>
            {show
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
      {error && <p style={{ margin:'6px 0 0', fontSize:11, color:'#F87171', fontFamily:'Poppins,sans-serif' }}>{error}</p>}
    </div>
  );
}

/* ── Decorative left panel ── */
function AuthLeft({ lang }) {
  return (
    <div style={{
      flex:'0 0 52%', position:'relative', overflow:'hidden',
      background:'linear-gradient(145deg, #060A14 0%, #0A1628 50%, #071520 100%)',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      padding:'48px 52px',
    }}>
      {/* SVG decorative mesh */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }} viewBox="0 0 700 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="600" cy="-60" r="340" stroke="#00C9B8" strokeWidth="1"/>
        <circle cx="600" cy="-60" r="240" stroke="#00C9B8" strokeWidth="0.8"/>
        <circle cx="-80" cy="860" r="420" stroke="#3B9ECC" strokeWidth="0.8"/>
        <circle cx="-80" cy="860" r="280" stroke="#3B9ECC" strokeWidth="0.6"/>
        <line x1="0" y1="200" x2="700" y2="600" stroke="#00C9B8" strokeWidth="0.5"/>
        <line x1="0" y1="400" x2="700" y2="200" stroke="#00C9B8" strokeWidth="0.4"/>
        <line x1="100" y1="0" x2="400" y2="800" stroke="#3B9ECC" strokeWidth="0.4"/>
        <path d="M-100 500 Q200 300 500 500 T1100 500" stroke="#00C9B8" strokeWidth="1.2" strokeDasharray="4 8"/>
        <path d="M-100 560 Q200 360 500 560 T1100 560" stroke="#00C9B8" strokeWidth="0.7" strokeDasharray="3 10"/>
        <circle cx="350" cy="420" r="180" stroke="rgba(0,201,184,0.4)" strokeWidth="1.5" strokeDasharray="6 12"/>
        <circle cx="350" cy="420" r="120" stroke="rgba(0,201,184,0.25)" strokeWidth="1" strokeDasharray="4 8"/>
        {/* dots */}
        {[[80,150],[200,280],[500,180],[560,360],[300,600],[140,520],[620,500],[420,720]].map(([cx,cy],i)=>(
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#00C9B8" opacity="0.6"/>
        ))}
      </svg>

      {/* Teal glow blob */}
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', top:'-20%', right:'-20%',
        background:'radial-gradient(circle, rgba(0,201,184,0.12) 0%, transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', bottom:'-15%', left:'-10%',
        background:'radial-gradient(circle, rgba(59,158,204,0.1) 0%, transparent 65%)', pointerEvents:'none' }}/>

      {/* Logo */}
      <div style={{ position:'relative', zIndex:1 }}>
        <img src="assets/logo_full.png" alt="Syltalky" style={{ height:38, objectFit:'contain' }}/>
      </div>

      {/* Center hero text */}
      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingTop:40 }}>
        <div style={{
          fontSize:13, fontWeight:600, color:'#00C9B8', fontFamily:'Poppins,sans-serif',
          letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:18,
          display:'flex', alignItems:'center', gap:8,
        }}>
          <div style={{ width:24, height:1.5, background:'#00C9B8' }}/>
          {lang === 'vi' ? 'Phiên dịch cử chỉ thông minh' : 'Smart Gesture Translation'}
        </div>
        <h1 style={{
          fontSize:48, fontWeight:800, lineHeight:1.1, color:'#fff',
          fontFamily:'Poppins,sans-serif', letterSpacing:'-1.5px', margin:0,
        }}>
          {lang === 'vi'
            ? <><span style={{color:'#00C9B8'}}>Nói</span> bằng<br/>cử chỉ</>
            : <><span style={{color:'#00C9B8'}}>Speak</span><br/>with gesture</>
          }
        </h1>
        <p style={{
          marginTop:22, fontSize:14, color:'rgba(255,255,255,0.45)',
          fontFamily:'Poppins,sans-serif', lineHeight:1.7, maxWidth:340,
        }}>
          {lang === 'vi'
            ? 'Syltalky chuyển đổi ngôn ngữ ký hiệu thành giọng nói theo thời gian thực, phá vỡ rào cản giao tiếp.'
            : 'Syltalky converts sign language into speech in real time, breaking down communication barriers.'}
        </p>
      </div>

      {/* Bottom badge */}
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(0,201,184,0.1)', border:'1px solid rgba(0,201,184,0.25)',
          borderRadius:99, padding:'8px 16px',
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#00C9B8', boxShadow:'0 0 8px #00C9B8' }}/>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontFamily:'Poppins,sans-serif' }}>
            {lang === 'vi' ? 'Nhận diện thời gian thực · AI-powered' : 'Real-time recognition · AI-powered'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Login ── */
function LoginScreen({ onLogin, onGoRegister, lang }) {
  const [email, setEmail] = useStAuth('');
  const [pass,  setPass]  = useStAuth('');
  const [remember, setRemember] = useStAuth(false);
  const [errors, setErrors] = useStAuth({});
  const [loading, setLoading] = useStAuth(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = window.tx('errEmailReq', lang);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = window.tx('errEmailInvalid', lang);
    if (!pass) e.pass = window.tx('errPassReq', lang);
    else if (pass !== 'demo123') e.pass = window.tx('errPassWrong', lang);
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (!Object.keys(e).length) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onLogin({ email }); }, 600);
    }
  };

  const handleKey = e => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{
      width:'100vw', height:'100vh', display:'flex', overflow:'hidden',
      background:'#07090F',
    }}>
      <AuthLeft lang={lang} />

      {/* Right: form */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 64px', background:'#07090F', position:'relative',
        overflowY:'auto',
      }}>
        {/* Lang toggle */}
        <div style={{ position:'absolute', top:28, right:32, display:'flex', gap:4 }}>
          {['vi','en'].map(l => (
            <span key={l} style={{
              fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, cursor:'pointer',
              fontFamily:'Poppins,sans-serif', letterSpacing:'0.06em', textTransform:'uppercase',
              color: lang===l ? '#00C9B8' : 'rgba(255,255,255,0.25)',
              background: lang===l ? 'rgba(0,201,184,0.1)' : 'transparent',
              border: `1px solid ${lang===l ? 'rgba(0,201,184,0.3)' : 'transparent'}`,
              transition:'all 0.15s',
            }}>
              {l === 'vi' ? 'VI' : 'EN'}
            </span>
          ))}
        </div>

        <div style={{ maxWidth:360, width:'100%' }}>
          <p style={{ fontSize:12, color:'#00C9B8', fontWeight:600, fontFamily:'Poppins,sans-serif', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
            {lang === 'vi' ? 'Chào mừng trở lại' : 'Welcome back'}
          </p>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#fff', fontFamily:'Poppins,sans-serif', letterSpacing:'-0.8px', margin:'0 0 40px' }}>
            {window.tx('login', lang)}
          </h2>

          <Field label={lang==='vi'?'Email':'Email'} type="email" value={email} onChange={setEmail}
            placeholder="email@example.com" error={errors.email} autoFocus />
          <div onKeyDown={handleKey}>
            <Field label={lang==='vi'?'Mật khẩu':'Password'} type="password" value={pass} onChange={setPass}
              placeholder="••••••••" error={errors.pass} />
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div onClick={() => setRemember(r=>!r)} style={{
                width:16, height:16, borderRadius:4,
                border:`1.5px solid ${remember ? '#00C9B8' : 'rgba(255,255,255,0.2)'}`,
                background: remember ? '#00C9B8' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.15s', cursor:'pointer', flexShrink:0,
              }}>
                {remember && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>}
              </div>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'Poppins,sans-serif' }}>{window.tx('rememberMe',lang)}</span>
            </label>
          </div>

          <button onClick={submit} disabled={loading} style={{
            width:'100%', padding:'14px', borderRadius:10, border:'none',
            background: loading ? 'rgba(0,201,184,0.5)' : 'linear-gradient(135deg, #00C9B8 0%, #0099CC 100%)',
            color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:15,
            cursor: loading ? 'default' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 32px rgba(0,201,184,0.4)',
            transition:'all 0.2s', letterSpacing:'0.02em',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}
          >
            {loading
              ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{animation:'spin 0.8s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>{lang==='vi'?'Đang đăng nhập...':'Signing in...'}</>
              : window.tx('login', lang)
            }
          </button>

          <p style={{ textAlign:'center', marginTop:28, fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Poppins,sans-serif' }}>
            {window.tx('noAccount', lang)}{' '}
            <span onClick={onGoRegister} style={{ color:'#00C9B8', cursor:'pointer', fontWeight:600, textDecoration:'underline', textUnderlineOffset:3 }}>
              {window.tx('register', lang)}
            </span>
          </p>

          <p style={{ textAlign:'center', marginTop:14, fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'Poppins,sans-serif' }}>
            Demo: email@example.com / demo123
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Register ── */
function RegisterScreen({ onRegister, onGoLogin, lang }) {
  const [email, setEmail] = useStAuth('');
  const [pass,  setPass]  = useStAuth('');
  const [confirm, setConfirm] = useStAuth('');
  const [errors, setErrors] = useStAuth({});
  const [loading, setLoading] = useStAuth(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = window.tx('errEmailReq', lang);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = window.tx('errEmailInvalid', lang);
    if (!pass) e.pass = window.tx('errPassReq', lang);
    if (!confirm) e.confirm = window.tx('errConfirmReq', lang);
    else if (confirm !== pass) e.confirm = window.tx('errPassMismatch', lang);
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (!Object.keys(e).length) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onRegister({ email }); }, 600);
    }
  };

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', overflow:'hidden', background:'#07090F' }}>
      <AuthLeft lang={lang} />

      <div style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 64px', background:'#07090F', overflowY:'auto',
      }}>
        <div style={{ maxWidth:360, width:'100%' }}>
          <p style={{ fontSize:12, color:'#00C9B8', fontWeight:600, fontFamily:'Poppins,sans-serif', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
            {lang === 'vi' ? 'Bắt đầu miễn phí' : 'Get started free'}
          </p>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#fff', fontFamily:'Poppins,sans-serif', letterSpacing:'-0.8px', margin:'0 0 40px' }}>
            {window.tx('createAccount', lang)}
          </h2>

          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" error={errors.email} autoFocus />
          <Field label={lang==='vi'?'Mật khẩu':'Password'} type="password" value={pass} onChange={setPass} placeholder="••••••••" error={errors.pass} />
          <Field label={lang==='vi'?'Xác nhận mật khẩu':'Confirm password'} type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" error={errors.confirm} />

          <button onClick={submit} disabled={loading} style={{
            width:'100%', padding:'14px', borderRadius:10, border:'none',
            background: loading ? 'rgba(0,201,184,0.5)' : 'linear-gradient(135deg, #00C9B8 0%, #0099CC 100%)',
            color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:15,
            cursor: loading ? 'default' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 32px rgba(0,201,184,0.4)',
            transition:'all 0.2s', marginTop:8,
          }}
            onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; }}
          >
            {loading ? (lang==='vi'?'Đang tạo tài khoản...':'Creating account...') : window.tx('register', lang)}
          </button>

          <p style={{ textAlign:'center', marginTop:28, fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'Poppins,sans-serif' }}>
            {window.tx('hasAccount', lang)}{' '}
            <span onClick={onGoLogin} style={{ color:'#00C9B8', cursor:'pointer', fontWeight:600, textDecoration:'underline', textUnderlineOffset:3 }}>
              {window.tx('login', lang)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, RegisterScreen });
