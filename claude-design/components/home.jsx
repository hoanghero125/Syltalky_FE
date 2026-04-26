// Home screen
const { useState: useStHome } = React;

function HomeScreen({ appState, dispatch }) {
  const { language: lang, user, notes, theme } = appState;
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const cardBg = isDark ? '#141720' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const hoverBorder = isDark ? 'rgba(0,201,184,0.3)' : 'rgba(0,201,184,0.4)';
  const sectionBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  const recentNotes = (window.RECENT_IDS || [])
    .map(id => notes.find(n => n.id === id && !n.deleted))
    .filter(Boolean).slice(0,5);
  const favoriteNotes = notes.filter(n => n.starred && !n.deleted);

  const tagColors = {
    'quan-trọng': { bg:'rgba(239,68,68,0.15)', color:'#F87171' },
    'khách-hàng': { bg:'rgba(0,201,184,0.15)', color:'#00C9B8' },
    'dự-án': { bg:'rgba(123,97,255,0.15)', color:'#A78BFA' },
  };

  function FileCard({ note, onClick }) {
    const [hovered, setHovered] = useStHome(false);
    return (
      <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
        background: cardBg, border:`1.5px solid ${hovered ? hoverBorder : cardBorder}`,
        borderRadius:12, padding:'16px 16px 14px', cursor:'pointer',
        transition:'all 0.18s', transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
        minWidth:0, display:'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
          <span style={{ color: note.type==='folder' ? '#F97316' : '#00C9B8', flexShrink:0, marginTop:1 }}>
            {note.type === 'folder' ? <Icons.Folder /> : <Icons.File />}
          </span>
          <div style={{ fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:13, color:fg, lineHeight:1.4, wordBreak:'break-word' }}>
            {note.name}
          </div>
        </div>
        {note.tags && note.tags.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {note.tags.map(tag => (
              <span key={tag} style={{
                fontSize:10, fontFamily:'Poppins,sans-serif', padding:'2px 7px', borderRadius:99,
                background: (tagColors[tag] || {bg:'rgba(255,255,255,0.08)'}).bg,
                color: (tagColors[tag] || {color:'#8B8FA8'}).color,
                fontWeight:500,
              }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif', marginTop:'auto' }}>{note.modified}</div>
      </div>
    );
  }

  function Section({ title, children, emptyMsg }) {
    return (
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:13, fontWeight:700, color:subFg, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Poppins,sans-serif', marginBottom:14 }}>
          {title}
        </div>
        {React.Children.count(children) === 0
          ? <div style={{ fontSize:13, color:subFg, fontFamily:'Poppins,sans-serif', opacity:0.5 }}>{emptyMsg}</div>
          : children}
      </div>
    );
  }

  const guideItems = [
    { icon:'🚀', title: lang==='vi' ? 'Thiết lập cuộc họp' : 'Meeting Setup', color:'rgba(0,201,184,0.1)', border:'rgba(0,201,184,0.2)' },
    { icon:'💡', title: lang==='vi' ? 'Mẹo nhận diện tốt' : 'Recognition Tips', color:'rgba(123,97,255,0.1)', border:'rgba(123,97,255,0.2)' },
    { icon:'🎨', title: lang==='vi' ? 'Cá nhân hóa' : 'Personalization', color:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.2)' },
  ];

  return (
    <div style={{
      flex:1, overflowY:'auto', padding:'40px 48px',
      background: isDark ? '#0C0E14' : '#F5F6FA',
    }}>
      {/* Welcome */}
      <div style={{ marginBottom:40 }}>
        <h1 style={{
          fontSize:26, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif',
          margin:0, letterSpacing:'-0.4px',
        }}>
          {window.tx('welcomeBack', lang)}, <span style={{ color:'#00C9B8' }}>{user.name.split(' ').pop()}</span> 👋
        </h1>
        <p style={{ fontSize:13, color:subFg, fontFamily:'Poppins,sans-serif', marginTop:6 }}>
          {new Date().toLocaleDateString(lang==='vi' ? 'vi-VN' : 'en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Recent */}
      <Section title={window.tx('recentFiles', lang)} emptyMsg={lang==='vi' ? 'Chưa có file nào' : 'No recent files'}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {recentNotes.map(n => (
            <FileCard key={n.id} note={n} onClick={() => dispatch({ type:'OPEN_FILE', file:n })} />
          ))}
        </div>
      </Section>

      {/* Favorites */}
      <Section title={window.tx('favorites', lang)} emptyMsg={lang==='vi' ? 'Chưa có file yêu thích' : 'No favorites yet'}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {favoriteNotes.map(n => (
            <FileCard key={n.id} note={n} onClick={() => dispatch({ type:'OPEN_FILE', file:n })} />
          ))}
        </div>
      </Section>


    </div>
  );
}

// File detail view
function FileDetailScreen({ file, onBack, appState, dispatch }) {
  const { language: lang, theme } = appState;
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const cardBg = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const sampleContent = [
    { time:'09:00', speaker: lang==='vi'?'Người dùng':'User', text: lang==='vi'?'Xin chào mọi người, hôm nay chúng ta sẽ thảo luận về tiến độ dự án Syltalky.':'Hello everyone, today we will discuss the progress of the Syltalky project.' },
    { time:'09:02', speaker: lang==='vi'?'Người dùng':'User', text: lang==='vi'?'Phần thiết kế UI đã hoàn thành 80%, chúng tôi đang làm việc trên các tương tác.':'The UI design is 80% complete, we are working on interactions.' },
    { time:'09:05', speaker: lang==='vi'?'Người dùng':'User', text: lang==='vi'?'Tuần tới sẽ bắt đầu tích hợp backend với nhận diện cử chỉ.':'Next week we will start integrating the backend with gesture recognition.' },
    { time:'09:10', speaker: lang==='vi'?'Người dùng':'User', text: lang==='vi'?'Cần thêm 2 tuần để hoàn thiện tính năng tóm tắt tự động.':'Need 2 more weeks to complete the automatic summarization feature.' },
  ];

  const summary = lang==='vi'
    ? '📝 Tóm tắt: Cuộc họp thảo luận về tiến độ dự án Syltalky. UI hoàn thành 80%, tích hợp backend sẽ bắt đầu tuần tới. Cần 2 tuần thêm cho tính năng tóm tắt tự động.'
    : '📝 Summary: Meeting discussed Syltalky project progress. UI is 80% complete, backend integration starts next week. 2 more weeks needed for auto-summarization.';

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'32px 48px', background: isDark ? '#0C0E14' : '#F5F6FA' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
        <div onClick={onBack} style={{
          cursor:'pointer', color:subFg, padding:'6px 10px', borderRadius:7,
          display:'flex', alignItems:'center', gap:6, fontSize:13, fontFamily:'Poppins,sans-serif',
          transition:'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color=fg}
          onMouseLeave={e => e.currentTarget.style.color=subFg}
        >
          <Icons.ChevronLeft /> {lang==='vi'?'Quay lại':'Back'}
        </div>
        <div style={{ width:1, height:16, background:borderC }}/>
        <div style={{ color:subFg, fontSize:12, fontFamily:'Poppins,sans-serif' }}>{file.path || (lang==='vi'?'Thư viện':'Library')}</div>
      </div>

      <div style={{
        background:cardBg, border:`1px solid ${borderC}`, borderRadius:14, overflow:'hidden',
        maxWidth:800,
      }}>
        {/* Header */}
        <div style={{ padding:'24px 28px', borderBottom:`1px solid ${borderC}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ color:'#00C9B8' }}><Icons.File /></span>
              <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{file.name}</h1>
            </div>
            <div style={{ fontSize:12, color:subFg, fontFamily:'Poppins,sans-serif' }}>
              {file.creator} · {file.modified}
            </div>
          </div>
          <div onClick={() => dispatch({ type:'TOGGLE_STAR', id:file.id })} style={{ cursor:'pointer', color: file.starred ? '#F59E0B' : subFg, padding:6 }}>
            <Icons.Star filled={file.starred} />
          </div>
        </div>

        {/* Summary box */}
        <div style={{ margin:'20px 28px', background:'rgba(0,201,184,0.07)', border:'1px solid rgba(0,201,184,0.2)', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ fontSize:12, color:'#00C9B8', fontWeight:700, fontFamily:'Poppins,sans-serif', marginBottom:6, letterSpacing:'0.04em' }}>
            {lang==='vi'?'TÓM TẮT CUỘC HỌP':'MEETING SUMMARY'}
          </div>
          <p style={{ margin:0, fontSize:13, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.7 }}>{summary}</p>
        </div>

        {/* Transcript */}
        <div style={{ padding:'0 28px 28px' }}>
          <div style={{ fontSize:12, color:subFg, fontWeight:700, fontFamily:'Poppins,sans-serif', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:14 }}>
            {lang==='vi'?'NỘI DUNG PHIÊN':'TRANSCRIPT'}
          </div>
          {sampleContent.map((line, i) => (
            <div key={i} style={{ display:'flex', gap:14, marginBottom:14 }}>
              <span style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif', flexShrink:0, paddingTop:2, width:36 }}>{line.time}</span>
              <div>
                <div style={{ fontSize:11, color:'#00C9B8', fontFamily:'Poppins,sans-serif', fontWeight:600, marginBottom:3 }}>{line.speaker}</div>
                <div style={{ fontSize:14, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.6 }}>{line.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, FileDetailScreen });
