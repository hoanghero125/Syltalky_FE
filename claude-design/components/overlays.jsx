// Search overlay + Trash popup
const { useState: useStOv, useEffect: useEffOv, useRef: useRefOv } = React;

/* ─── SEARCH OVERLAY ─── */
function SearchOverlay({ appState, dispatch }) {
  const { language: lang, notes, theme } = appState;
  const [query, setQuery] = useStOv('');
  const [selected, setSelected] = useStOv(null);
  const [filterDate, setFilterDate] = useStOv(false);
  const [filterAuthor, setFilterAuthor] = useStOv(false);
  const [filterTag, setFilterTag] = useStOv(false);
  const inputRef = useRefOv(null);

  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const overlayBg = isDark ? '#0D0F17' : '#1A1C2E';
  const panelBg = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const rowHover = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const highlightBg = isDark ? '#1C2030' : '#F8F9FC';

  const recentNotes = (window.RECENT_IDS||[]).map(id=>notes.find(n=>n.id===id&&!n.deleted)).filter(Boolean).slice(0,4);

  const results = query.trim()
    ? notes.filter(n => !n.deleted && n.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffOv(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const FilterChip = ({ label, icon, active, onToggle }) => (
    <div onClick={onToggle} style={{
      display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:99,
      border:`1px solid ${active ? 'rgba(0,201,184,0.5)' : borderC}`,
      background: active ? 'rgba(0,201,184,0.12)' : 'transparent',
      color: active ? '#00C9B8' : subFg,
      cursor:'pointer', fontSize:12, fontFamily:'Poppins,sans-serif', fontWeight: active?600:400,
      transition:'all 0.15s', userSelect:'none',
    }}>
      {icon}{label}
    </div>
  );

  const FileRow = ({ note, highlighted }) => (
    <div onClick={() => setSelected(note)} style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8,
      cursor:'pointer', background: highlighted ? 'rgba(0,201,184,0.1)' : 'transparent',
      border: `1px solid ${highlighted ? 'rgba(0,201,184,0.3)' : 'transparent'}`,
      transition:'all 0.15s', marginBottom:2,
    }}
      onMouseEnter={e => { if(!highlighted) e.currentTarget.style.background = rowHover; }}
      onMouseLeave={e => { if(!highlighted) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: note.type==='folder'?'#F97316':'#00C9B8', flexShrink:0 }}>
        {note.type==='folder' ? <Icons.Folder/> : <Icons.File/>}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:fg, fontFamily:'Poppins,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {note.name}
        </div>
        {note.path && <div style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif' }}>{note.path}</div>}
      </div>
      <div style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif', flexShrink:0 }}>{note.modified}</div>
    </div>
  );

  const HighlightPanel = ({ note }) => (
    <div onClick={() => dispatch({ type:'OPEN_FILE', file:note })} style={{
      flex:'0 0 260px', background:highlightBg, border:`1px solid ${borderC}`,
      borderRadius:12, padding:'18px', cursor:'pointer', overflow:'hidden',
      transition:'border-color 0.15s',
    }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,201,184,0.4)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor=borderC}
    >
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ color:note.type==='folder'?'#F97316':'#00C9B8' }}>
          {note.type==='folder'?<Icons.Folder/>:<Icons.File/>}
        </span>
        <div style={{ fontSize:13, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{note.name}</div>
      </div>
      <div style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif', marginBottom:6 }}>{note.creator} · {note.modified}</div>
      {note.path && <div style={{ fontSize:11, color:subFg, fontFamily:'Poppins,sans-serif', marginBottom:12 }}>{note.path}</div>}
      {note.tags?.length>0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
          {note.tags.map(t=>(
            <span key={t} style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:'rgba(0,201,184,0.12)', color:'#00C9B8', fontFamily:'Poppins,sans-serif' }}>{t}</span>
          ))}
        </div>
      )}
      <div style={{ fontSize:12, color:'#00C9B8', fontFamily:'Poppins,sans-serif', fontWeight:500 }}>
        {lang==='vi'?'Nhấn để mở →':'Click to open →'}
      </div>
    </div>
  );

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      paddingTop:80,
    }} onClick={e => { if(e.target===e.currentTarget) dispatch({type:'OVERLAY',overlay:'search',val:false}); }}>
      <div style={{
        width:'min(740px,90vw)', background:panelBg,
        border:`1px solid ${borderC}`, borderRadius:16,
        boxShadow:'0 32px 80px rgba(0,0,0,0.5)', overflow:'hidden',
        maxHeight:'75vh', display:'flex', flexDirection:'column',
      }}>
        {/* Search bar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:`1px solid ${borderC}` }}>
          <span style={{ color:subFg, flexShrink:0 }}><Icons.Search/></span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder={window.tx('searchPh',lang)}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:16, color:fg, fontFamily:'Poppins,sans-serif' }} />
          <div onClick={()=>dispatch({type:'OVERLAY',overlay:'search',val:false})} style={{ cursor:'pointer', color:subFg, padding:4 }}>
            <Icons.X size={16}/>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, padding:'10px 16px', borderBottom:`1px solid ${borderC}` }}>
          <FilterChip label={window.tx('filterDate',lang)} icon={<Icons.CalendarIcon/>} active={filterDate} onToggle={()=>setFilterDate(f=>!f)} />
          <FilterChip label={window.tx('filterAuthor',lang)} icon={<Icons.AuthorIcon/>} active={filterAuthor} onToggle={()=>setFilterAuthor(f=>!f)} />
          <FilterChip label={window.tx('filterTag',lang)} icon={<Icons.TagIcon/>} active={filterTag} onToggle={()=>setFilterTag(f=>!f)} />
        </div>

        {/* Results / Recent */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 12px' }}>
          {query.trim() ? (
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {results.length===0
                  ? <div style={{ padding:'16px', fontSize:13, color:subFg, fontFamily:'Poppins,sans-serif', textAlign:'center' }}>{lang==='vi'?'Không tìm thấy kết quả':'No results found'}</div>
                  : results.map(n=><FileRow key={n.id} note={n} highlighted={selected?.id===n.id} />)
                }
              </div>
              {selected && <HighlightPanel note={selected} />}
            </div>
          ) : (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:subFg, letterSpacing:'0.07em', textTransform:'uppercase', fontFamily:'Poppins,sans-serif', padding:'4px 6px 8px' }}>
                {window.tx('recentSearches',lang)}
              </div>
              {recentNotes.map(n=><FileRow key={n.id} note={n} highlighted={selected?.id===n.id} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── TRASH POPUP ─── */
function TrashPopup({ appState, dispatch }) {
  const { language: lang, trash, theme } = appState;
  const [query, setQuery] = useStOv('');

  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const bg = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const rowHover = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const filtered = trash.filter(t => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:900,
      display:'flex', alignItems:'center', justifyContent:'flex-start',
    }} onClick={e => { if(e.target===e.currentTarget) dispatch({type:'OVERLAY',overlay:'trash',val:false}); }}>
      <div style={{
        position:'absolute', left:230, bottom:60,
        width:380, maxHeight:480,
        background:bg, border:`1px solid ${borderC}`,
        borderRadius:14, boxShadow:'0 16px 48px rgba(0,0,0,0.35)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px', borderBottom:`1px solid ${borderC}` }}>
          <span style={{ color:subFg, flexShrink:0 }}><Icons.Search/></span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={window.tx('trashPh',lang)}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:fg, fontFamily:'Poppins,sans-serif' }} />
          <div onClick={()=>dispatch({type:'OVERLAY',overlay:'trash',val:false})} style={{ cursor:'pointer', color:subFg }}>
            <Icons.X size={14}/>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:6, padding:'8px 12px', borderBottom:`1px solid ${borderC}` }}>
          {[
            { label:window.tx('filterDate',lang), icon:<Icons.CalendarIcon/> },
            { label:window.tx('filterAuthor',lang), icon:<Icons.AuthorIcon/> },
            { label:window.tx('filterTag',lang), icon:<Icons.TagIcon/> },
          ].map(f=>(
            <div key={f.label} style={{
              display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99,
              border:`1px solid ${borderC}`, color:subFg, cursor:'pointer',
              fontSize:11, fontFamily:'Poppins,sans-serif',
            }}>{f.icon}{f.label}</div>
          ))}
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {filtered.length===0
            ? <div style={{ padding:'24px', textAlign:'center', fontSize:12, color:subFg, fontFamily:'Poppins,sans-serif' }}>{window.tx('empty',lang)}</div>
            : filtered.map(item=>(
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, transition:'background 0.12s' }}
                onMouseEnter={e=>e.currentTarget.style.background=rowHover}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ color:item.type==='folder'?'#F97316':subFg, flexShrink:0 }}>
                  {item.type==='folder'?<Icons.Folder/>:<Icons.File/>}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:fg, fontFamily:'Poppins,sans-serif', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize:10, color:subFg, fontFamily:'Poppins,sans-serif' }}>{item.deletedAt} · {item.creator}</div>
                </div>
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  <ActionBtn onClick={()=>dispatch({type:'RESTORE_TRASH',id:item.id})} title={window.tx('restore',lang)}>
                    <Icons.Restore/>
                  </ActionBtn>
                  <ActionBtn onClick={()=>dispatch({type:'DELETE_PERM',id:item.id})} title={window.tx('deletePerm',lang)}>
                    <Icons.DeleteRow/>
                  </ActionBtn>
                </div>
              </div>
            ))
          }
        </div>

        {/* Footer note */}
        <div style={{ padding:'10px 14px', borderTop:`1px solid ${borderC}`, fontSize:10, color:subFg, fontFamily:'Poppins,sans-serif', lineHeight:1.5 }}>
          {window.tx('trashInfo',lang)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SearchOverlay, TrashPopup });
