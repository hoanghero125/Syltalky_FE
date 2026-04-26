// Settings — popup modal with TTS voice panel
const { useState: useStSet2, useRef: useRefSet2, useEffect: useEffSet2 } = React;

const FONT_FAMILIES2 = ['Poppins','DM Sans','Nunito','Source Sans Pro','Open Sans','Roboto'];
const PRESET_VOICES = [
  { id:'nam-bac',  name:'Nam Miền Bắc',  lang:'vi', gender:'male',   desc:'Giọng trầm, rõ ràng' },
  { id:'nu-bac',   name:'Nữ Miền Bắc',   lang:'vi', gender:'female', desc:'Giọng trong, tự nhiên' },
  { id:'nam-nam',  name:'Nam Miền Nam',  lang:'vi', gender:'male',   desc:'Giọng ấm, thân thiện' },
  { id:'nu-nam',   name:'Nữ Miền Nam',   lang:'vi', gender:'female', desc:'Giọng nhẹ nhàng' },
  { id:'en-male',  name:'Male – US',      lang:'en', gender:'male',   desc:'Clear, neutral accent' },
  { id:'en-female',name:'Female – US',    lang:'en', gender:'female', desc:'Warm, expressive' },
];
const RECORD_TEXT_VI = 'Xin chào, đây là giọng nói của tôi. Tôi đang sử dụng ứng dụng Syltalky để phiên dịch cử chỉ thành lời nói.';
const RECORD_TEXT_EN = 'Hello, this is my voice. I am using Syltalky to translate sign language gestures into speech.';

function SettingsModal({ appState, dispatch }) {
  const { language: lang, theme, user, settings } = appState;
  const [panel, setPanel] = useStSet2('overview');

  const isDark = theme === 'dark';
  const fg      = isDark ? '#E8EAF0' : '#1A1C2E';
  const subFg   = isDark ? '#8B8FA8' : '#6B7280';
  const bg      = isDark ? '#0F1117' : '#F5F6FA';
  const cardBg  = isDark ? '#1A1E2C' : '#FFFFFF';
  const sideBar = isDark ? '#0C0E14' : '#ECEEF4';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
  const activeBg= isDark ? 'rgba(0,201,184,0.12)' : 'rgba(0,201,184,0.1)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  const panels = [
    { key:'overview',        label: lang==='vi'?'Tổng quan':'Overview' },
    { key:'personalization', label: lang==='vi'?'Cá nhân hóa':'Personalization' },
    { key:'devices',         label: lang==='vi'?'Thiết bị':'Devices' },
    { key:'subtitles',       label: lang==='vi'?'Phụ đề':'Subtitles' },
    { key:'voice',           label: lang==='vi'?'Giọng nói TTS':'TTS Voice' },
  ];

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:800,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={e=>{ if(e.target===e.currentTarget) dispatch({type:'OVERLAY',overlay:'settings',val:false}); }}>
      <div style={{
        width:'min(860px,92vw)', height:'min(620px,90vh)',
        background:bg, border:`1px solid ${borderC}`, borderRadius:18,
        boxShadow:'0 32px 80px rgba(0,0,0,0.5)',
        display:'flex', overflow:'hidden',
      }}>
        {/* Left nav */}
        <div style={{ width:188, flexShrink:0, background:sideBar, borderRight:`1px solid ${borderC}`, display:'flex', flexDirection:'column', padding:'20px 10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 6px 16px', borderBottom:`1px solid ${borderC}`, marginBottom:8 }}>
            <img src="assets/logo_round.png" alt="" style={{ width:22, height:22, objectFit:'contain' }}/>
            <span style={{ fontSize:13, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>{window.tx('settings',lang)}</span>
          </div>
          {panels.map(p=>(
            <div key={p.key} onClick={()=>setPanel(p.key)} style={{
              padding:'9px 12px', borderRadius:8, cursor:'pointer', fontFamily:'Poppins,sans-serif',
              fontSize:13, fontWeight:panel===p.key?600:400,
              color:panel===p.key?'#00C9B8':subFg,
              background:panel===p.key?activeBg:'transparent',
              transition:'all 0.15s', marginBottom:2,
            }}
              onMouseEnter={e=>{ if(panel!==p.key) e.currentTarget.style.background=hoverBg; }}
              onMouseLeave={e=>{ if(panel!==p.key) e.currentTarget.style.background='transparent'; }}
            >{p.label}</div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px 0', flexShrink:0 }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:fg, fontFamily:'Poppins,sans-serif' }}>
              {panels.find(p=>p.key===panel)?.label}
            </h2>
            <div onClick={()=>dispatch({type:'OVERLAY',overlay:'settings',val:false})} style={{
              cursor:'pointer', color:subFg, width:30, height:30, borderRadius:7,
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background=hoverBg; e.currentTarget.style.color=fg; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=subFg; }}
            ><Icons.X /></div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'18px 24px 24px' }}>
            {panel==='overview'        && <OverviewPanel2      {...{appState,dispatch,isDark,fg,subFg,cardBg,borderC,lang}} />}
            {panel==='personalization' && <PersonalizationPanel2 {...{appState,dispatch,isDark,fg,subFg,cardBg,borderC,lang}} />}
            {panel==='devices'         && <DevicesPanel2       {...{appState,dispatch,isDark,fg,subFg,cardBg,borderC,lang}} />}
            {panel==='subtitles'       && <SubtitlesPanel2     {...{appState,dispatch,isDark,fg,subFg,cardBg,borderC,lang}} />}
            {panel==='voice'           && <VoicePanel          {...{appState,dispatch,isDark,fg,subFg,cardBg,borderC,lang}} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── shared helpers ── */
function SCard({ title, children, cardBg, borderC, subFg }) {
  return (
    <div style={{ background:cardBg, border:`1px solid ${borderC}`, borderRadius:11, padding:'16px 20px', marginBottom:16 }}>
      {title && <div style={{ fontSize:11, fontWeight:700, color:subFg, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:'Poppins,sans-serif', marginBottom:14 }}>{title}</div>}
      {children}
    </div>
  );
}

function ToggleGroup2({ options, value, onChange, isDark, borderC }) {
  return (
    <div style={{ display:'flex', background:isDark?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.05)', borderRadius:9, padding:3, border:`1px solid ${borderC}`, width:'fit-content' }}>
      {options.map(opt=>(
        <button key={opt.value} onClick={()=>onChange(opt.value)} style={{
          padding:'7px 20px', borderRadius:7, border:'none', cursor:'pointer',
          fontFamily:'Poppins,sans-serif', fontSize:13, fontWeight:value===opt.value?600:400,
          background:value===opt.value?(isDark?'rgba(0,201,184,0.2)':'rgba(0,201,184,0.15)'):'transparent',
          color:value===opt.value?'#00C9B8':(isDark?'#8B8FA8':'#6B7280'), transition:'all 0.15s',
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

/* ── panels ── */
function OverviewPanel2({ appState, dispatch, isDark, fg, subFg, cardBg, borderC, lang }) {
  const { user } = appState;
  const [nameEdit, setNameEdit] = useStSet2(user.name);
  const fileRef = useRefSet2(null);
  const initials = (user.name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <>
      <SCard title={lang==='vi'?'ẢNH ĐẠI DIỆN':'AVATAR'} {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:64,height:64,borderRadius:'50%',flexShrink:0,overflow:'hidden',border:'2px solid rgba(0,201,184,0.3)',
            background:user.avatar?'transparent':'linear-gradient(135deg,#00C9B8,#0099AA)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff',fontFamily:'Poppins,sans-serif' }}>
            {user.avatar?<img src={user.avatar} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:initials}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>dispatch({type:'SET_AVATAR',avatar:ev.target.result});r.readAsDataURL(f);}}}/>
            <button onClick={()=>fileRef.current?.click()} style={{ padding:'6px 14px',borderRadius:7,border:'1px solid rgba(0,201,184,0.4)',background:'rgba(0,201,184,0.1)',color:'#00C9B8',fontFamily:'Poppins,sans-serif',fontSize:12,fontWeight:600,cursor:'pointer' }}>{window.tx('changeAvatar',lang)}</button>
            <button onClick={()=>dispatch({type:'SET_AVATAR',avatar:null})} style={{ padding:'6px 14px',borderRadius:7,border:`1px solid ${borderC}`,background:'transparent',color:subFg,fontFamily:'Poppins,sans-serif',fontSize:12,cursor:'pointer' }}>{window.tx('removeAvatar',lang)}</button>
          </div>
        </div>
      </SCard>
      <SCard title={lang==='vi'?'TÊN HIỂN THỊ':'DISPLAY NAME'} {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex',gap:10 }}>
          <input value={nameEdit} onChange={e=>setNameEdit(e.target.value)} style={{ flex:1,padding:'9px 12px',borderRadius:8,border:`1.5px solid ${borderC}`,background:isDark?'rgba(0,0,0,0.3)':'#F5F6FA',color:fg,fontFamily:'Poppins,sans-serif',fontSize:14,outline:'none' }}
            onFocus={e=>e.target.style.borderColor='rgba(0,201,184,0.5)'} onBlur={e=>e.target.style.borderColor=borderC}/>
          <button onClick={()=>dispatch({type:'SET_NAME',name:nameEdit})} style={{ padding:'9px 18px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#00C9B8,#0099AA)',color:'#fff',fontFamily:'Poppins,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer' }}>{lang==='vi'?'Lưu':'Save'}</button>
        </div>
      </SCard>
    </>
  );
}

function PersonalizationPanel2({ appState, dispatch, isDark, fg, subFg, cardBg, borderC, lang }) {
  return (
    <>
      <SCard title={lang==='vi'?'GIAO DIỆN':'THEME'} {...{cardBg,borderC,subFg}}>
        <ToggleGroup2 options={[{value:'light',label:window.tx('light',lang)},{value:'dark',label:window.tx('dark',lang)}]} value={appState.theme} onChange={v=>dispatch({type:'SET_THEME',theme:v})} isDark={isDark} borderC={borderC}/>
      </SCard>
      <SCard title={lang==='vi'?'NGÔN NGỮ':'LANGUAGE'} {...{cardBg,borderC,subFg}}>
        <ToggleGroup2 options={[{value:'vi',label:'Tiếng Việt (VN)'},{value:'en',label:'English (US)'}]} value={appState.language} onChange={v=>dispatch({type:'SET_LANG',language:v})} isDark={isDark} borderC={borderC}/>
      </SCard>
    </>
  );
}

function DevicesPanel2({ appState, dispatch, isDark, fg, subFg, cardBg, borderC, lang }) {
  const { settings } = appState;
  const videoRef = useRefSet2(null);
  const [camActive, setCamActive] = useStSet2(false);
  const animRef = useRefSet2(null);

  useEffSet2(()=>{
    let stream;
    navigator.mediaDevices?.getUserMedia({video:true}).then(s=>{stream=s;if(videoRef.current)videoRef.current.srcObject=s;setCamActive(true);}).catch(()=>setCamActive(false));
    return ()=>{stream?.getTracks().forEach(t=>t.stop());};
  },[]);

  const sel = { padding:'9px 12px',borderRadius:8,border:`1.5px solid ${borderC}`,background:isDark?'rgba(0,0,0,0.3)':'#F5F6FA',color:fg,fontFamily:'Poppins,sans-serif',fontSize:13,outline:'none',width:'100%',cursor:'pointer' };

  return (
    <>
      <SCard title="CAMERA" {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:6 }}>{window.tx('camera',lang)}</label>
            <select style={sel}><option>{lang==='vi'?'Camera mặc định':'Default Camera'}</option><option>{lang==='vi'?'Camera tích hợp':'Built-in Camera'}</option></select>
          </div>
          <div style={{ flexShrink:0,width:140,height:88,borderRadius:8,overflow:'hidden',background:'#000',border:`1px solid ${borderC}`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
            {camActive?<video ref={videoRef} autoPlay muted style={{width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)'}}/>:<Icons.CameraOff/>}
            {camActive&&<div style={{position:'absolute',top:5,right:5,width:7,height:7,borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 6px #22C55E'}}/>}
          </div>
        </div>
      </SCard>
      <SCard title="MICROPHONE" {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex',gap:14,alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:6 }}>{window.tx('microphone',lang)}</label>
            <select style={sel}><option>{lang==='vi'?'Micro mặc định':'Default Microphone'}</option></select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:6 }}>{window.tx('inputVol',lang)} — {settings.micVolume}%</label>
            <input type="range" min={0} max={100} value={settings.micVolume} onChange={e=>dispatch({type:'SET_SETTING',key:'micVolume',val:+e.target.value})} style={{width:'100%',accentColor:'#00C9B8'}}/>
          </div>
        </div>
      </SCard>
      <SCard title="SPEAKER" {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex',gap:14,alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:6 }}>{window.tx('speaker',lang)}</label>
            <select style={sel}><option>{lang==='vi'?'Loa mặc định':'Default Speaker'}</option></select>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:6 }}>{window.tx('outputVol',lang)} — {settings.speakerVolume}%</label>
            <input type="range" min={0} max={100} value={settings.speakerVolume} onChange={e=>dispatch({type:'SET_SETTING',key:'speakerVolume',val:+e.target.value})} style={{width:'100%',accentColor:'#00C9B8'}}/>
          </div>
        </div>
      </SCard>
    </>
  );
}

function SubtitlesPanel2({ appState, dispatch, isDark, fg, subFg, cardBg, borderC, lang }) {
  const { settings } = appState;
  const [dropOpen, setDropOpen] = useStSet2(false);
  return (
    <>
      <SCard {...{cardBg,borderC,subFg}}>
        <div style={{ display:'flex',gap:20 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:8 }}>{window.tx('fontSize',lang)} — {settings.fontSize}px</label>
            <input type="range" min={12} max={36} value={settings.fontSize} onChange={e=>dispatch({type:'SET_SETTING',key:'fontSize',val:+e.target.value})} style={{width:'100%',accentColor:'#00C9B8'}}/>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:subFg,fontFamily:'Poppins,sans-serif',marginTop:4 }}><span>12px</span><span>36px</span></div>
          </div>
          <div style={{ flex:1,position:'relative' }}>
            <label style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',fontWeight:600,display:'block',marginBottom:8 }}>{window.tx('fontFamily',lang)}</label>
            <div onClick={()=>setDropOpen(d=>!d)} style={{ padding:'9px 12px',borderRadius:8,border:`1.5px solid ${dropOpen?'rgba(0,201,184,0.5)':borderC}`,background:isDark?'rgba(0,0,0,0.3)':'#F5F6FA',color:fg,fontFamily:settings.fontFamily+',sans-serif',fontSize:13,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              {settings.fontFamily}<Icons.ChevronDown/>
            </div>
            {dropOpen&&<div style={{ position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:10,background:isDark?'#1C2030':'#FFFFFF',border:`1px solid ${borderC}`,borderRadius:8,overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
              {FONT_FAMILIES2.map(f=><div key={f} onClick={()=>{dispatch({type:'SET_SETTING',key:'fontFamily',val:f});setDropOpen(false);}} style={{ padding:'9px 12px',fontSize:13,fontFamily:f+',sans-serif',color:settings.fontFamily===f?'#00C9B8':fg,background:settings.fontFamily===f?'rgba(0,201,184,0.08)':'transparent',cursor:'pointer' }}>{f}</div>)}
            </div>}
          </div>
        </div>
      </SCard>
      <SCard title={lang==='vi'?'XEM TRƯỚC PHỤ ĐỀ':'SUBTITLE PREVIEW'} {...{cardBg,borderC,subFg}}>
        <div style={{ background:'#000',borderRadius:10,padding:'20px',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <span style={{ fontSize:settings.fontSize,fontFamily:settings.fontFamily+',sans-serif',color:'#fff',textShadow:'0 2px 8px rgba(0,0,0,0.8)',textAlign:'center' }}>{window.tx('previewText',lang)}</span>
        </div>
      </SCard>
    </>
  );
}

/* ── TTS Voice Panel ── */
function VoicePanel({ appState, dispatch, isDark, fg, subFg, cardBg, borderC, lang }) {
  const [mode, setMode] = useStSet2('design');           // 'design' | 'clone'
  const [selectedVoice, setSelectedVoice] = useStSet2('nu-bac');
  const [cloneTab, setCloneTab] = useStSet2('upload');   // 'upload' | 'record'
  const [recordPhase, setRecordPhase] = useStSet2('idle'); // idle | countdown | recording | done
  const [countdown, setCountdown] = useStSet2(3);
  const [recTime, setRecTime] = useStSet2(0);
  const [transcript, setTranscript] = useStSet2('');
  const [wavName, setWavName] = useStSet2('');
  const [demoText, setDemoText] = useStSet2(lang==='vi'?'Xin chào, đây là giọng nói của tôi.':'Hello, this is my voice.');
  const [playing, setPlaying] = useStSet2(false);
  const fileRef = useRefSet2(null);
  const timerRef = useRefSet2(null);
  const MAX_REC = 15;

  const startRecord = () => {
    setRecordPhase('countdown');
    setCountdown(3);
    let c = 3;
    timerRef.current = setInterval(()=>{
      c--;
      setCountdown(c);
      if (c<=0) {
        clearInterval(timerRef.current);
        setRecordPhase('recording');
        setRecTime(0);
        let t = 0;
        timerRef.current = setInterval(()=>{
          t++;
          setRecTime(t);
          if (t >= MAX_REC) { clearInterval(timerRef.current); setRecordPhase('done'); }
        }, 1000);
      }
    }, 1000);
  };

  const stopRecord = () => {
    clearInterval(timerRef.current);
    setRecordPhase('done');
  };

  const handleWav = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setWavName(f.name);
    setTranscript(lang==='vi'
      ? 'Xin chào, đây là bản ghi âm giọng nói của tôi dùng để clone. Tôi đang đọc đoạn văn bản này để hệ thống nhận diện và tái tạo giọng nói.'
      : 'Hello, this is my voice recording for cloning. I am reading this text so the system can recognize and replicate my voice.'
    );
  };

  const playDemo = () => {
    setPlaying(true);
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(demoText);
      utt.lang = lang==='vi'?'vi-VN':'en-US';
      utt.onend = ()=>setPlaying(false);
      speechSynthesis.speak(utt);
    } else { setTimeout(()=>setPlaying(false), 2000); }
  };

  const inputStyle = { width:'100%',padding:'9px 12px',borderRadius:8,border:`1.5px solid ${borderC}`,background:isDark?'rgba(0,0,0,0.3)':'#F5F6FA',color:fg,fontFamily:'Poppins,sans-serif',fontSize:13,outline:'none',resize:'vertical' };

  return (
    <>
      {/* Mode toggle */}
      <SCard title={lang==='vi'?'CHẾ ĐỘ GIỌNG NÓI':'VOICE MODE'} {...{cardBg,borderC,subFg}}>
        <ToggleGroup2
          options={[
            {value:'design',label:lang==='vi'?'🎙 Voice Design':'🎙 Voice Design'},
            {value:'clone', label:lang==='vi'?'🧬 Voice Clone':'🧬 Voice Clone'},
          ]}
          value={mode} onChange={setMode} isDark={isDark} borderC={borderC}
        />
        <p style={{ margin:'10px 0 0',fontSize:12,color:subFg,fontFamily:'Poppins,sans-serif' }}>
          {mode==='design'
            ? (lang==='vi'?'Chọn từ các giọng đọc có sẵn để sử dụng trong cuộc họp.':'Choose from preset voices to use in your meetings.')
            : (lang==='vi'?'Huấn luyện AI nhận diện giọng nói của bạn để tái tạo trung thực.':'Train the AI to replicate your unique voice accurately.')
          }
        </p>
      </SCard>

      {/* Voice Design */}
      {mode==='design' && (
        <SCard title={lang==='vi'?'CHỌN GIỌNG':'SELECT VOICE'} {...{cardBg,borderC,subFg}}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {PRESET_VOICES.map(v=>{
              const active = selectedVoice===v.id;
              return (
                <div key={v.id} onClick={()=>setSelectedVoice(v.id)} style={{
                  padding:'12px 14px',borderRadius:9,cursor:'pointer',
                  border:`1.5px solid ${active?'#00C9B8':borderC}`,
                  background:active?'rgba(0,201,184,0.08)':'transparent',
                  transition:'all 0.15s',
                }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:13,fontWeight:600,color:fg,fontFamily:'Poppins,sans-serif' }}>{v.name}</span>
                    <span style={{ fontSize:10,padding:'2px 7px',borderRadius:99,
                      background:v.gender==='female'?'rgba(236,72,153,0.12)':'rgba(59,130,246,0.12)',
                      color:v.gender==='female'?'#F472B6':'#60A5FA',fontFamily:'Poppins,sans-serif' }}>
                      {v.gender==='female'?(lang==='vi'?'Nữ':'Female'):(lang==='vi'?'Nam':'Male')}
                    </span>
                  </div>
                  <div style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',marginTop:3 }}>{v.desc}</div>
                  {active&&<div style={{ fontSize:10,color:'#00C9B8',fontFamily:'Poppins,sans-serif',marginTop:4,fontWeight:600 }}>✓ {lang==='vi'?'Đang dùng':'Active'}</div>}
                </div>
              );
            })}
          </div>
        </SCard>
      )}

      {/* Voice Clone */}
      {mode==='clone' && (
        <SCard title={lang==='vi'?'NGUỒN GIỌNG NÓI':'VOICE SOURCE'} {...{cardBg,borderC,subFg}}>
          {/* Sub-tabs */}
          <div style={{ display:'flex',gap:4,marginBottom:16,background:isDark?'rgba(0,0,0,0.3)':'rgba(0,0,0,0.05)',borderRadius:9,padding:3,width:'fit-content' }}>
            {[{k:'upload',vi:'⬆ Upload WAV',en:'⬆ Upload WAV'},{k:'record',vi:'🎙 Ghi âm',en:'🎙 Record'}].map(t=>(
              <button key={t.k} onClick={()=>setCloneTab(t.k)} style={{
                padding:'6px 16px',borderRadius:7,border:'none',cursor:'pointer',
                fontFamily:'Poppins,sans-serif',fontSize:12,fontWeight:cloneTab===t.k?600:400,
                background:cloneTab===t.k?(isDark?'rgba(0,201,184,0.2)':'rgba(0,201,184,0.12)'):'transparent',
                color:cloneTab===t.k?'#00C9B8':(isDark?'#8B8FA8':'#6B7280'),transition:'all 0.15s',
              }}>{lang==='vi'?t.vi:t.en}</button>
            ))}
          </div>

          {/* Upload WAV */}
          {cloneTab==='upload' && (
            <div>
              <input type="file" accept=".wav,audio/*" ref={fileRef} style={{display:'none'}} onChange={handleWav}/>
              <div onClick={()=>fileRef.current?.click()} style={{
                border:`2px dashed ${borderC}`,borderRadius:10,padding:'20px',textAlign:'center',
                cursor:'pointer',transition:'border-color 0.15s',
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,201,184,0.4)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=borderC}
              >
                {wavName
                  ? <div style={{ fontSize:13,color:'#00C9B8',fontFamily:'Poppins,sans-serif',fontWeight:600 }}>📁 {wavName}</div>
                  : <>
                      <div style={{ fontSize:24,marginBottom:6 }}>🎵</div>
                      <div style={{ fontSize:13,color:fg,fontFamily:'Poppins,sans-serif',fontWeight:500 }}>{lang==='vi'?'Kéo thả hoặc nhấn để chọn file WAV':'Drag & drop or click to select WAV'}</div>
                      <div style={{ fontSize:11,color:subFg,fontFamily:'Poppins,sans-serif',marginTop:4 }}>{lang==='vi'?'Tối đa 15 giây':'Max 15 seconds'}</div>
                    </>
                }
              </div>

              {transcript && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:subFg,fontFamily:'Poppins,sans-serif',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6 }}>
                    {lang==='vi'?'TRANSCRIPT (CÓ THỂ CHỈNH SỬA)':'TRANSCRIPT (EDITABLE)'}
                  </div>
                  <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} rows={4} style={{...inputStyle}}/>
                  <button style={{ marginTop:10,padding:'8px 18px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#00C9B8,#0099AA)',color:'#fff',fontFamily:'Poppins,sans-serif',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                    {lang==='vi'?'Xác nhận & Huấn luyện':'Confirm & Train'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Record */}
          {cloneTab==='record' && (
            <div>
              {/* Text to read */}
              <div style={{ background:isDark?'rgba(0,201,184,0.06)':'rgba(0,201,184,0.05)',border:'1px solid rgba(0,201,184,0.2)',borderRadius:9,padding:'12px 14px',marginBottom:14 }}>
                <div style={{ fontSize:11,color:'#00C9B8',fontWeight:700,fontFamily:'Poppins,sans-serif',marginBottom:6 }}>
                  {lang==='vi'?'ĐỌC ĐOẠN VĂN SAU:':'PLEASE READ THE FOLLOWING:'}
                </div>
                <p style={{ margin:0,fontSize:13,color:fg,fontFamily:'Poppins,sans-serif',lineHeight:1.65 }}>
                  {lang==='vi'?RECORD_TEXT_VI:RECORD_TEXT_EN}
                </p>
              </div>

              {/* Record control */}
              <div style={{ textAlign:'center' }}>
                {recordPhase==='idle' && (
                  <button onClick={startRecord} style={{ padding:'11px 28px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#00C9B8,#0099AA)',color:'#fff',fontFamily:'Poppins,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 6px 20px rgba(0,201,184,0.3)' }}>
                    {lang==='vi'?'🎙 Bắt đầu ghi âm':'🎙 Start Recording'}
                  </button>
                )}
                {recordPhase==='countdown' && (
                  <div style={{ fontSize:56,fontWeight:700,color:'#00C9B8',fontFamily:'Poppins,sans-serif' }}>{countdown}</div>
                )}
                {recordPhase==='recording' && (
                  <div>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12 }}>
                      <div style={{ width:10,height:10,borderRadius:'50%',background:'#EF4444',animation:'pulse 1s infinite' }}/>
                      <span style={{ fontSize:14,color:fg,fontFamily:'Poppins,sans-serif',fontWeight:600 }}>{recTime}s / {MAX_REC}s</span>
                    </div>
                    <div style={{ background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)',borderRadius:99,height:4,marginBottom:14,overflow:'hidden' }}>
                      <div style={{ width:`${(recTime/MAX_REC)*100}%`,height:'100%',background:'#EF4444',transition:'width 0.5s' }}/>
                    </div>
                    <button onClick={stopRecord} style={{ padding:'9px 22px',borderRadius:9,border:'1px solid rgba(239,68,68,0.4)',background:'rgba(239,68,68,0.1)',color:'#F87171',fontFamily:'Poppins,sans-serif',fontWeight:600,fontSize:13,cursor:'pointer' }}>
                      {lang==='vi'?'Dừng':'Stop'}
                    </button>
                  </div>
                )}
                {recordPhase==='done' && (
                  <div>
                    <div style={{ fontSize:13,color:'#22C55E',fontFamily:'Poppins,sans-serif',fontWeight:600,marginBottom:12 }}>
                      ✓ {lang==='vi'?`Đã ghi ${recTime}s`:`Recorded ${recTime}s`}
                    </div>
                    <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
                      <button onClick={()=>setRecordPhase('idle')} style={{ padding:'8px 16px',borderRadius:8,border:`1px solid ${borderC}`,background:'transparent',color:subFg,fontFamily:'Poppins,sans-serif',fontSize:12,cursor:'pointer' }}>{lang==='vi'?'Ghi lại':'Re-record'}</button>
                      <button style={{ padding:'8px 18px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#00C9B8,#0099AA)',color:'#fff',fontFamily:'Poppins,sans-serif',fontSize:12,fontWeight:600,cursor:'pointer' }}>{lang==='vi'?'Xác nhận & Huấn luyện':'Confirm & Train'}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SCard>
      )}

      {/* Demo box */}
      <SCard title={lang==='vi'?'THỬ GIỌNG NÓI':'VOICE DEMO'} {...{cardBg,borderC,subFg}}>
        <textarea value={demoText} onChange={e=>setDemoText(e.target.value)} rows={2} style={{...inputStyle,marginBottom:10}}/>
        <button onClick={playDemo} disabled={playing} style={{
          padding:'9px 22px',borderRadius:9,border:'none',
          background:playing?'rgba(0,201,184,0.2)':'linear-gradient(135deg,#00C9B8,#0099AA)',
          color:playing?'#00C9B8':'#fff',fontFamily:'Poppins,sans-serif',fontWeight:600,fontSize:13,
          cursor:playing?'default':'pointer',transition:'all 0.2s',
          display:'flex',alignItems:'center',gap:8,
        }}>
          {playing
            ? <><Icons.Wave/>{lang==='vi'?'Đang phát...':'Playing...'}</>
            : <><Icons.Volume/>{lang==='vi'?'Nghe thử':'Preview Voice'}</>
          }
        </button>
      </SCard>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </>
  );
}

Object.assign(window, { SettingsModal });
