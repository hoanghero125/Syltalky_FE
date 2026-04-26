// Library — meeting sessions list view
const { useState: useStLib2 } = React;

const MEETING_SESSIONS = [
  { id:1, name:'Họp nhóm dự án Q1 2026',    date:'24/04/2026', duration:'47 phút', creator:'Nguyễn Văn A', tags:['quan-trọng'], starred:true,  summary:'Thảo luận tiến độ Q1, phân công nhiệm vụ tháng 5, review kết quả sprint.' },
  { id:2, name:'Phiên họp khách hàng ABC',   date:'23/04/2026', duration:'32 phút', creator:'Nguyễn Văn A', tags:['khách-hàng'], starred:false, summary:'Trình bày demo sản phẩm, thu thập phản hồi, thống nhất roadmap.' },
  { id:3, name:'Cuộc họp ban giám đốc',      date:'20/04/2026', duration:'61 phút', creator:'Nguyễn Văn A', tags:['quan-trọng'], starred:false, summary:'Báo cáo tài chính Q1, kế hoạch tuyển dụng, chiến lược mở rộng thị trường.' },
  { id:4, name:'Sprint Review tháng 3',      date:'18/04/2026', duration:'28 phút', creator:'Trần Thị B',   tags:[],              starred:true,  summary:'Kiểm tra các tính năng đã hoàn thành, xác định backlog cho sprint mới.' },
  { id:5, name:'Báo cáo tiến độ dự án',      date:'15/04/2026', duration:'19 phút', creator:'Nguyễn Văn A', tags:[],              starred:false, summary:'Cập nhật trạng thái từng module, xử lý blockers và rủi ro kỹ thuật.' },
  { id:6, name:'Onboarding thành viên mới',  date:'10/04/2026', duration:'53 phút', creator:'Trần Thị B',   tags:[],              starred:false, summary:'Giới thiệu quy trình làm việc, cài đặt môi trường, phân công dự án.' },
];

const TAG_COLORS = {
  'quan-trọng': { bg:'rgba(239,68,68,0.15)',   color:'#F87171' },
  'khách-hàng': { bg:'rgba(0,201,184,0.15)',   color:'#00C9B8' },
  'dự-án':      { bg:'rgba(123,97,255,0.15)',  color:'#A78BFA' },
};

function LibraryScreen({ appState, dispatch }) {
  const { language: lang, theme, notes } = appState;
  const [search, setSearch] = useStLib2('');
  const [tab, setTab] = useStLib2('all');    // all | starred
  const [starred, setStarred] = useStLib2(() => {
    const s = {};
    MEETING_SESSIONS.forEach(s2=>{ s[s2.id]=s2.starred; });
    return s;
  });

  const isDark = theme === 'dark';
  const fg      = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg   = isDark ? '#8B8FA8' : '#6B7280';
  const bg      = isDark ? '#0C0E14' : '#F5F6FA';
  const cardBg  = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const hoverBorder = 'rgba(0,201,184,0.35)';
  const tabActiveBg = isDark ? 'rgba(0,201,184,0.15)' : 'rgba(0,201,184,0.1)';

  const sessions = MEETING_SESSIONS
    .filter(s => tab==='starred' ? starred[s.id] : true)
    .filter(s => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()));

  function SessionCard({ s }) {
    const [hov, setHov] = useStLib2(false);
    const isStarred = starred[s.id];
    return (
      <div onClick={()=>dispatch({type:'OPEN_FILE', file:{...s, type:'file', modified:s.date, path:'', creator:s.creator}})}
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{
          background:cardBg, border:`1.5px solid ${hov ? hoverBorder : borderC}`,
          borderRadius:12, padding:'18px 20px', cursor:'pointer',
          transition:'all 0.18s', transform:hov?'translateY(-2px)':'none',
          boxShadow:hov?'0 8px 24px rgba(0,0,0,0.15)':'none',
          display:'flex', gap:16, alignItems:'flex-start',
        }}
      >
        {/* Icon */}
        <div style={{
          width:44, height:44, borderRadius:10, flexShrink:0, marginTop:2,
          background:'rgba(0,201,184,0.1)', border:'1px solid rgba(0,201,184,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#00C9B8',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
            <path d="M19 10v2a7 7 0 01-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:6 }}>
            <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.4 }}>{s.name}</h3>
            <div onClick={e=>{ e.stopPropagation(); setStarred(prev=>({...prev,[s.id]:!prev[s.id]})); }}
              style={{ cursor:'pointer', color:isStarred?'#F59E0B':subFg, flexShrink:0, padding:2, transition:'color 0.15s' }}>
              <Icons.Star filled={isStarred} />
            </div>
          </div>

          <p style={{ margin:'0 0 10px', fontSize:12, color:subFg, fontFamily:'Poppins,sans-serif', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {s.summary}
          </p>

          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {/* Date */}
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif' }}>
              <Icons.CalendarIcon />{s.date}
            </div>
            {/* Duration */}
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {s.duration}
            </div>
            {/* Creator */}
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif' }}>
              <Icons.AuthorIcon />{s.creator}
            </div>
            {/* Tags */}
            {s.tags.map(t=>(
              <span key={t} style={{
                fontSize:10, padding:'2px 8px', borderRadius:99, fontFamily:'Poppins,sans-serif', fontWeight:500,
                background:(TAG_COLORS[t]||{bg:'rgba(255,255,255,0.08)'}).bg,
                color:(TAG_COLORS[t]||{color:'#8B8FA8'}).color,
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'36px 48px', background:bg }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif', margin:0, letterSpacing:'-0.3px' }}>
          {window.tx('libraryTitle', lang)}
        </h1>
        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:cardBg, border:`1.5px solid ${borderC}`, borderRadius:9, padding:'8px 14px', minWidth:220 }}>
          <span style={{ color:subFg }}><Icons.Search /></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={lang==='vi'?'Tìm cuộc họp...':'Search sessions...'}
            style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:fg, fontFamily:'Poppins,sans-serif', width:'100%' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', borderRadius:10, padding:4, width:'fit-content' }}>
        {[{key:'all',labelVi:'Tất cả',labelEn:'All'},{key:'starred',labelVi:'Yêu thích',labelEn:'Favorites'}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:'7px 20px', borderRadius:7, border:'none', cursor:'pointer',
            fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:tab===t.key?600:400,
            background:tab===t.key?tabActiveBg:'transparent',
            color:tab===t.key?'#00C9B8':subFg, transition:'all 0.15s',
          }}>
            {lang==='vi'?t.labelVi:t.labelEn}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize:12, color:subFg, fontFamily:'Poppins,sans-serif', marginBottom:16 }}>
        {sessions.length} {lang==='vi'?'phiên họp':'sessions'}
      </div>

      {/* Cards */}
      {sessions.length===0
        ? <div style={{ textAlign:'center', padding:'48px', color:subFg, fontFamily:'Poppins,sans-serif', fontSize:14 }}>{window.tx('empty',lang)}</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:800 }}>
            {sessions.map(s=><SessionCard key={s.id} s={s} />)}
          </div>
      }
    </div>
  );
}

Object.assign(window, { LibraryScreen });
