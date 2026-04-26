// Guide screen
const { useState: useStGuide } = React;

function GuideScreen({ appState, dispatch }) {
  const { language: lang, theme } = appState;
  const [openCard, setOpenCard] = useStGuide(null);
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const bg = isDark ? '#0C0E14' : '#F5F6FA';
  const cardBg = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const guides = (window.GUIDE_CONTENT || {})[lang] || [];

  const iconMap = {
    setup: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
    tips: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/>
      </svg>
    ),
    personalize: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  };

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'36px 48px', background:bg }}>
      <h1 style={{ fontSize:24, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif', margin:'0 0 28px', letterSpacing:'-0.3px' }}>
        {window.tx('guideTitle', lang)}
      </h1>
      <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:740 }}>
        {guides.map((g, i) => {
          const isOpen = openCard === g.id;
          return (
            <div key={g.id} style={{
              background: cardBg, border:`1.5px solid ${isOpen ? g.color+'66' : borderC}`,
              borderRadius:14, overflow:'hidden',
              boxShadow: isOpen ? `0 8px 32px ${g.color}22` : 'none',
              transition:'all 0.2s',
            }}>
              {/* Header */}
              <div onClick={() => setOpenCard(isOpen ? null : g.id)} style={{
                display:'flex', alignItems:'center', gap:16, padding:'20px 24px',
                cursor:'pointer',
                background: isOpen ? `${g.color}12` : 'transparent',
                borderBottom: isOpen ? `1px solid ${g.color}33` : '1px solid transparent',
                transition:'all 0.2s',
              }}>
                <div style={{
                  width:48, height:48, borderRadius:12, flexShrink:0,
                  background:`${g.color}20`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:g.color,
                }}>
                  {iconMap[g.icon]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{g.title}</div>
                  <div style={{ fontSize:12, color:subFg, fontFamily:'Poppins,sans-serif', marginTop:3 }}>
                    {g.steps.length} {lang==='vi'?'bước':'steps'}
                  </div>
                </div>
                <div style={{
                  color: isOpen ? g.color : subFg,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition:'transform 0.2s',
                }}>
                  <Icons.ChevronDown />
                </div>
              </div>

              {/* Steps (collapsible) */}
              {isOpen && (
                <div style={{ padding:'20px 24px 24px' }}>
                  {g.steps.map((step, idx) => (
                    <div key={idx} style={{ display:'flex', gap:14, marginBottom: idx < g.steps.length-1 ? 14 : 0 }}>
                      <div style={{
                        width:24, height:24, borderRadius:'50%', flexShrink:0,
                        background:`${g.color}20`, color:g.color,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, fontFamily:'Poppins,sans-serif',
                        marginTop:1,
                      }}>
                        {idx+1}
                      </div>
                      <p style={{ margin:0, fontSize:14, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.65 }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { GuideScreen });
