// Sidebar v3 — no search, no recent, collapsed = toggle only, user row → context menu
const { useState: useStSb3, useEffect: useEffSb3, useRef: useRefSb3 } = React;

function Sidebar({ appState, dispatch }) {
  const { currentScreen, language: lang, user, theme } = appState;
  const [userMenuOpen, setUserMenuOpen] = useStSb3(false);
  const menuRef = useRefSb3(null);

  const isDark = theme === 'dark';
  const fg      = isDark ? '#E8EAF0' : '#1A1C2E';
  const bg      = isDark ? '#0F1117' : '#F0F2F8';
  const subFg   = isDark ? '#8B8FA8' : '#6B7280';
  const activeBg= isDark ? 'rgba(0,201,184,0.12)' : 'rgba(0,201,184,0.1)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const menuBg  = isDark ? '#1A1E2C' : '#FFFFFF';

  // Close menu on outside click
  useEffSb3(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const navItems = [
    { key:'home',    icon:<Icons.Home />,    labelKey:'home',    action:()=>dispatch({type:'NAV',screen:'home'}) },
    { key:'library', icon:<Icons.Library />, labelKey:'library', action:()=>dispatch({type:'NAV',screen:'library'}) },
  ];

  const initials = (user.name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  const NavItem = ({ item }) => {
    const active = currentScreen === item.key;
    return (
      <div onClick={item.action} style={{
        display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8,
        cursor:'pointer', color: active ? '#00C9B8' : subFg,
        background: active ? activeBg : 'transparent',
        transition:'all 0.15s', fontFamily:'Poppins,sans-serif', fontSize:13,
        fontWeight: active ? 600 : 400, userSelect:'none',
      }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=hoverBg; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent'; }}
      >
        <span style={{ opacity:active?1:0.7, flexShrink:0 }}>{item.icon}</span>
        {window.tx(item.labelKey, lang)}
      </div>
    );
  };

  return (
    <div style={{
      width:220, flexShrink:0, display:'flex', flexDirection:'column',
      background:bg, borderRight:`1px solid ${borderC}`, height:'100%', overflow:'hidden',
    }}>
      {/* Logo + collapse */}
      <div style={{ padding:'16px 14px 14px', borderBottom:`1px solid ${borderC}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <img src="assets/logo_full.png" alt="Syltalky" style={{ height:28, objectFit:'contain', maxWidth:130 }}/>
        <div onClick={()=>dispatch({type:'TOGGLE_SIDEBAR'})} style={{
          cursor:'pointer', color:subFg, padding:5, borderRadius:6, flexShrink:0, transition:'all 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.color=fg; e.currentTarget.style.background=hoverBg;}}
          onMouseLeave={e=>{e.currentTarget.style.color=subFg; e.currentTarget.style.background='transparent';}}
        >
          <Icons.PanelLeft />
        </div>
      </div>

      {/* Meeting CTA */}
      <div style={{ padding:'14px 12px', borderBottom:`1px solid ${borderC}` }}>
        <div onClick={()=>dispatch({type:'MEETING',phase:'precheck'})} style={{
          background:'linear-gradient(135deg, #00C9B8 0%, #0099CC 100%)',
          borderRadius:10, padding:'12px 14px', cursor:'pointer',
          display:'flex', alignItems:'center', gap:10,
          boxShadow:'0 6px 20px rgba(0,201,184,0.35)',
          transition:'all 0.2s', userSelect:'none', position:'relative', overflow:'hidden',
        }}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(0,201,184,0.45)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 6px 20px rgba(0,201,184,0.35)';}}
        >
          <div style={{ position:'absolute',right:-8,top:-8,width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.08)' }}/>
          <div style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:'#fff',fontFamily:'Poppins,sans-serif' }}>
              {lang==='vi'?'Bắt đầu phiên dịch':'Start Session'}
            </div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.7)',fontFamily:'Poppins,sans-serif',marginTop:1 }}>
              {lang==='vi'?'Cử chỉ → Giọng nói':'Gesture → Voice'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>
        {navItems.map(item => <NavItem key={item.key} item={item} />)}
      </div>

      {/* Bottom: user row with context menu */}
      <div style={{ borderTop:`1px solid ${borderC}`, padding:'10px 8px', position:'relative' }} ref={menuRef}>

        {/* Context menu popup */}
        {userMenuOpen && (
          <div style={{
            position:'absolute', bottom:'calc(100% + 6px)', left:8, right:8,
            background:menuBg, border:`1px solid ${borderC}`,
            borderRadius:10, overflow:'hidden',
            boxShadow:'0 -8px 32px rgba(0,0,0,0.3)',
            zIndex:100,
          }}>
            <div onClick={()=>{ setUserMenuOpen(false); dispatch({type:'OVERLAY',overlay:'settings',val:true}); }}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',cursor:'pointer',
                fontFamily:'Poppins,sans-serif',fontSize:13,color:fg,transition:'background 0.12s' }}
              onMouseEnter={e=>e.currentTarget.style.background=hoverBg}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{ opacity:0.6 }}><Icons.Settings /></span>
              {window.tx('settings', lang)}
            </div>
            <div style={{ height:1, background:borderC, margin:'0 10px' }}/>
            <div onClick={()=>{ setUserMenuOpen(false); dispatch({type:'LOGOUT'}); }}
              style={{ display:'flex',alignItems:'center',gap:10,padding:'11px 14px',cursor:'pointer',
                fontFamily:'Poppins,sans-serif',fontSize:13,color:'#F87171',transition:'background 0.12s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.8}}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {lang==='vi'?'Đăng xuất':'Log out'}
            </div>
          </div>
        )}

        {/* User row */}
        <div onClick={()=>setUserMenuOpen(o=>!o)} style={{
          display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8,
          cursor:'pointer', transition:'background 0.15s', userSelect:'none',
          background: userMenuOpen ? (isDark?'rgba(255,255,255,0.06)':hoverBg) : 'transparent',
        }}
          onMouseEnter={e=>{ if(!userMenuOpen) e.currentTarget.style.background=hoverBg; }}
          onMouseLeave={e=>{ if(!userMenuOpen) e.currentTarget.style.background='transparent'; }}
        >
          <div style={{
            width:28, height:28, borderRadius:'50%', flexShrink:0, overflow:'hidden',
            background: user.avatar ? 'transparent' : 'linear-gradient(135deg,#00C9B8,#0099AA)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'#fff', fontFamily:'Poppins,sans-serif',
          }}>
            {user.avatar
              ? <img src={user.avatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
              : (user.name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:fg, fontFamily:'Poppins,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user.name}
            </div>
          </div>
          <div style={{ color:subFg, transition:'transform 0.15s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
            <Icons.ChevronDown />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Collapsed sidebar — just the toggle, no logo */
function SidebarToggle({ dispatch, theme }) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      width:44, flexShrink:0,
      background: isDark ? '#0F1117' : '#F0F2F8',
      borderRight:`1px solid ${isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)'}`,
      display:'flex', flexDirection:'column', alignItems:'center', paddingTop:14,
    }}>
      <div onClick={()=>dispatch({type:'TOGGLE_SIDEBAR'})} style={{
        cursor:'pointer', color: isDark?'#8B8FA8':'#6B7280', padding:8, borderRadius:7, transition:'all 0.15s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.color=isDark?'#E8EAF0':'#1A1C2E';e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)';}}
        onMouseLeave={e=>{e.currentTarget.style.color=isDark?'#8B8FA8':'#6B7280';e.currentTarget.style.background='transparent';}}
      >
        <Icons.PanelLeft />
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, SidebarToggle });
