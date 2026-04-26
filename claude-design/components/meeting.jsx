// Meeting flow: precheck → tips → active floating window → summary popup
const { useState: useStMeet, useEffect: useEffMeet, useRef: useRefMeet } = React;

/* subtitle lines for demo */
const SUBTITLE_LINES_VI = [
  'Xin chào, hệ thống đang hoạt động bình thường...',
  'Cử chỉ của bạn đã được nhận diện thành công.',
  'Tôi muốn trình bày về tiến độ dự án tháng này.',
  'Phần thiết kế đã hoàn thành, chúng ta sắp tích hợp backend.',
  'Mọi người có câu hỏi gì không?',
  'Tuần tới chúng ta sẽ review lại toàn bộ luồng.',
];
const SUBTITLE_LINES_EN = [
  'Hello, the system is running normally...',
  'Your gesture was recognized successfully.',
  'I want to present the project progress this month.',
  'Design is complete, we are about to integrate the backend.',
  'Does anyone have questions?',
  'Next week we will review the entire flow.',
];

function DeviceCheck({ lang, theme, onReady, onClose }) {
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const bg = isDark ? 'rgba(20,23,32,0.97)' : 'rgba(255,255,255,0.97)';
  const borderC = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const videoRef = useRefMeet(null);
  const [camOk, setCamOk] = useStMeet(false);
  const [micLevel, setMicLevel] = useStMeet(0);
  const animRef = useRefMeet(null);

  useEffMeet(() => {
    let stream;
    navigator.mediaDevices?.getUserMedia({ video:true, audio:true })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamOk(true);
        // Simulate mic level with random animation
        const tick = () => {
          setMicLevel(Math.random() * 80 + 10);
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        setCamOk(false);
        const tick = () => {
          setMicLevel(Math.random() * 60 + 10);
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      });
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(520px,90vw)', background:bg, border:`1px solid ${borderC}`, borderRadius:18, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${borderC}` }}>
          <div style={{ fontSize:16, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{window.tx('checkDevice',lang)}</div>
          <div onClick={onClose} style={{ cursor:'pointer', color:subFg, padding:4 }}><Icons.X size={16}/></div>
        </div>

        <div style={{ padding:'24px' }}>
          {/* Camera preview */}
          <div style={{ borderRadius:12, overflow:'hidden', background:'#000', aspectRatio:'16/9', position:'relative', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {camOk
              ? <video ref={videoRef} autoPlay muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} />
              : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:subFg }}>
                  <Icons.CameraOff />
                  <span style={{ fontSize:13, fontFamily:'Poppins,sans-serif' }}>{lang==='vi'?'Không thể truy cập camera':'Cannot access camera'}</span>
                </div>
            }
            <div style={{ position:'absolute', bottom:10, left:10, display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'4px 10px' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: camOk ? '#22C55E' : '#EF4444', boxShadow: camOk?'0 0 6px #22C55E':'none' }}/>
              <span style={{ fontSize:11, color:'#fff', fontFamily:'Poppins,sans-serif' }}>{window.tx('camStatus',lang)}</span>
            </div>
          </div>

          {/* Mic level */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:fg, fontFamily:'Poppins,sans-serif' }}>
                <Icons.Mic active />
                {window.tx('micStatus',lang)}
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {Array.from({length:12}).map((_,i) => (
                  <div key={i} style={{
                    width:6, height:18, borderRadius:3,
                    background: (i/12)*100 < micLevel
                      ? (i < 8 ? '#00C9B8' : i < 10 ? '#F59E0B' : '#EF4444')
                      : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                    transition:'background 0.05s',
                  }}/>
                ))}
              </div>
            </div>
          </div>

          <button onClick={onReady} style={{
            width:'100%', padding:'13px', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,#00C9B8,#0099AA)',
            color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:15,
            cursor:'pointer', boxShadow:'0 8px 24px rgba(0,201,184,0.3)',
            transition:'all 0.2s', letterSpacing:'0.02em',
          }}
            onMouseEnter={e=>e.target.style.transform='translateY(-1px)'}
            onMouseLeave={e=>e.target.style.transform='none'}
          >
            {window.tx('readyToMeet',lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingTips({ lang, theme, onStart, onBack }) {
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg = isDark ? '#8B8FA8' : '#6B7280';
  const bg = isDark ? 'rgba(20,23,32,0.97)' : 'rgba(255,255,255,0.97)';
  const borderC = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tips = [
    window.tx('tip1',lang), window.tx('tip2',lang),
    window.tx('tip3',lang), window.tx('tip4',lang),
  ];
  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(480px,90vw)', background:bg, border:`1px solid ${borderC}`, borderRadius:18, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid ${borderC}` }}>
          <div style={{ fontSize:16, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{window.tx('meetingTips',lang)}</div>
          <div onClick={onBack} style={{ cursor:'pointer', color:subFg }}><Icons.X size={16}/></div>
        </div>
        <div style={{ padding:'24px' }}>
          {tips.map((tip,i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ width:24,height:24,borderRadius:'50%',background:'rgba(0,201,184,0.15)',color:'#00C9B8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,fontFamily:'Poppins,sans-serif',flexShrink:0,marginTop:1 }}>{i+1}</div>
              <p style={{ margin:0, fontSize:14, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.65 }}>{tip}</p>
            </div>
          ))}
          <button onClick={onStart} style={{
            width:'100%', marginTop:8, padding:'13px', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,#00C9B8,#0099AA)',
            color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:15,
            cursor:'pointer', boxShadow:'0 8px 24px rgba(0,201,184,0.3)', transition:'all 0.2s',
          }}>{window.tx('startMeeting',lang)}</button>
        </div>
      </div>
    </div>
  );
}

function MeetingWindow({ lang, theme, onEnd }) {
  const lines = lang==='vi' ? SUBTITLE_LINES_VI : SUBTITLE_LINES_EN;
  const [lineIdx, setLineIdx] = useStMeet(0);
  const [pos, setPos] = useStMeet({ x: window.innerWidth - 460, y: 80 });
  const [size, setSize] = useStMeet({ w: 440, h: 280 });
  const [micOn, setMicOn] = useStMeet(true);
  const [camOn, setCamOn] = useStMeet(true);
  const dragging = useRefMeet(false);
  const dragStart = useRefMeet({ mx:0, my:0, ox:0, oy:0 });
  const videoRef = useRefMeet(null);

  useEffMeet(() => {
    const t = setInterval(() => setLineIdx(i => (i+1)%lines.length), 3000);
    return () => clearInterval(t);
  }, [lang]);

  useEffMeet(() => {
    if (!camOn) return;
    let stream;
    navigator.mediaDevices?.getUserMedia({ video:true })
      .then(s => { stream=s; if(videoRef.current) videoRef.current.srcObject=s; })
      .catch(()=>{});
    return () => stream?.getTracks().forEach(t=>t.stop());
  }, [camOn]);

  useEffMeet(() => {
    const onMove = e => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragStart.current.mx + dragStart.current.ox, y: e.clientY - dragStart.current.my + dragStart.current.oy });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp); };
  }, []);

  const onDragStart = e => {
    dragging.current = true;
    dragStart.current = { mx:e.clientX, my:e.clientY, ox:pos.x, oy:pos.y };
  };

  const isDark = true; // meeting window always dark
  const fg = '#E8EAF0'; const subFg = '#8B8FA8';
  const borderC = 'rgba(255,255,255,0.12)';

  return (
    <div style={{
      position:'fixed', left:pos.x, top:pos.y, width:size.w, zIndex:999,
      background:'rgba(10,12,18,0.92)', backdropFilter:'blur(12px)',
      border:`1px solid ${borderC}`, borderRadius:14,
      boxShadow:'0 24px 60px rgba(0,0,0,0.6)', overflow:'hidden',
      userSelect:'none',
    }}>
      {/* Title bar — drag handle */}
      <div onMouseDown={onDragStart} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', borderBottom:`1px solid ${borderC}`,
        cursor:'grab', background:'rgba(0,201,184,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 6px #22C55E' }}/>
          <span style={{ fontSize:12, color:'#00C9B8', fontFamily:'Poppins,sans-serif', fontWeight:600 }}>Syltalky · {lang==='vi'?'Đang họp':'Live'}</span>
        </div>
        <div onClick={onEnd} style={{ cursor:'pointer', color:subFg, padding:4 }}><Icons.X size={14}/></div>
      </div>

      {/* Subtitles area */}
      <div style={{ padding:'16px 16px 12px', minHeight:80 }}>
        <div style={{ fontSize:14, color:fg, fontFamily:'Poppins,sans-serif', lineHeight:1.7, textAlign:'center', transition:'all 0.4s' }}>
          {lines[lineIdx]}
        </div>
      </div>

      {/* Camera + toolbar */}
      <div style={{ position:'relative', padding:'0 12px 12px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10 }}>
        {/* Camera preview */}
        <div style={{ width:110, height:70, borderRadius:8, overflow:'hidden', background:'#000', border:`1px solid ${borderC}`, flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {camOn
            ? <video ref={videoRef} autoPlay muted style={{ width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)' }}/>
            : <Icons.CameraOff />
          }
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:6, alignItems:'center', flex:1, justifyContent:'center' }}>
          {[
            { icon: micOn ? <Icons.Mic active/> : <Icons.MicOff/>, onClick:()=>setMicOn(m=>!m), active:micOn, label:'Mic' },
            { icon: camOn ? <Icons.Camera active/> : <Icons.CameraOff/>, onClick:()=>setCamOn(c=>!c), active:camOn, label:'Cam' },
            { icon: <Icons.Captions/>, onClick:()=>{}, active:true, label:'Sub' },
          ].map((btn,i) => (
            <div key={i} onClick={btn.onClick} title={btn.label} style={{
              width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
              background: btn.active ? 'rgba(0,201,184,0.15)' : 'rgba(255,255,255,0.06)',
              border:`1px solid ${btn.active ? 'rgba(0,201,184,0.3)' : 'rgba(255,255,255,0.08)'}`,
              cursor:'pointer', color: btn.active ? '#00C9B8' : subFg, transition:'all 0.15s',
            }}>
              {btn.icon}
            </div>
          ))}
          <div onClick={onEnd} style={{
            padding:'6px 14px', borderRadius:8, background:'rgba(239,68,68,0.2)',
            border:'1px solid rgba(239,68,68,0.4)', color:'#F87171',
            fontFamily:'Poppins,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer',
            transition:'all 0.15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.3)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.2)'}
          >
            {window.tx('endMeeting',lang)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryPopup({ lang, theme, onView, onLater }) {
  const isDark = theme === 'dark';
  const fg = isDark ? '#E8EAF0' : '#1A1C2E';
  const bg = isDark ? '#141720' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return (
    <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'min(380px,90vw)', background:bg, border:`1px solid ${borderC}`, borderRadius:16, padding:'28px 28px 24px', boxShadow:'0 24px 60px rgba(0,0,0,0.4)', textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
        <h2 style={{ fontSize:16, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif', margin:'0 0 10px' }}>
          {window.tx('summaryReady',lang)}
        </h2>
        <p style={{ fontSize:13, color: isDark?'#8B8FA8':'#6B7280', fontFamily:'Poppins,sans-serif', margin:'0 0 22px', lineHeight:1.6 }}>
          {lang==='vi'?'Tóm tắt cuộc họp đã sẵn sàng để xem.':'Your meeting summary is ready to view.'}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onLater} style={{
            flex:1, padding:'10px', borderRadius:8, border:`1px solid ${borderC}`,
            background:'transparent', color: isDark?'#8B8FA8':'#6B7280',
            fontFamily:'Poppins,sans-serif', fontSize:13, cursor:'pointer',
          }}>{window.tx('later',lang)}</button>
          <button onClick={onView} style={{
            flex:2, padding:'10px', borderRadius:8, border:'none',
            background:'linear-gradient(135deg,#00C9B8,#0099AA)',
            color:'#fff', fontFamily:'Poppins,sans-serif', fontWeight:600, fontSize:13,
            cursor:'pointer', boxShadow:'0 4px 14px rgba(0,201,184,0.3)',
          }}>{window.tx('viewSummary',lang)}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DeviceCheck, MeetingTips, MeetingWindow, SummaryPopup });
