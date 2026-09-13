import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowUpRight,Bookmark,Camera,ChevronRight,Focus,Info,Keyboard,Layers3,Pause,RotateCcw,RotateCw,Scissors,Search,Trash2,Volume2,X,Zap} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Combobox,ComboboxInput,ComboboxContent,ComboboxList,ComboboxItem,ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene from './scene';
import {DEFAULT_VISIBLE,SYSTEMS,EXPLANATIONS,DISSECTION_STAGES,getDissectionSystems,explanation,type Atlas,type Concept,type SceneState,type SystemId,type View} from './anatomy';
interface BookmarkItem {id:string;name:string;system:SystemId;note?:string;addedAt:number}
const initial:SceneState={explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0};
export default function Home(){
 const detailTitle=useRef<HTMLHeadingElement>(null);
 const [atlas,setAtlas]=useState<Atlas|null>(null),[state,setState]=useState(initial),[progress,setProgress]=useState(0),[error,setError]=useState(''),[panel,setPanel]=useState<'layers'|'search'|null>(null),[details,setDetails]=useState(false),[about,setAbout]=useState(false),[help,setHelp]=useState(false),[query,setQuery]=useState(''),[chosen,setChosen]=useState<Concept|null>(null),[speaking,setSpeaking]=useState(false),[systemFilter,setSystemFilter]=useState<SystemId|'all'>('all');
 const [dissectionDepth,setDissectionDepth]=useState<number>(0),[impulseActive,setImpulseActive]=useState<boolean>(false),[impulseInfoOpen,setImpulseInfoOpen]=useState<boolean>(false);
 const toggleCadaverMode=()=>{
  setState(s=>{
   const next=!s.cadaverMode;
   if(next){
    const visible=getDissectionSystems(dissectionDepth);
    return {...s,cadaverMode:true,dissectionDepth,visible,explode:0,isolate:false,rotate:false};
   }
   return {...s,cadaverMode:false,visible:DEFAULT_VISIBLE};
  });
 };
 const handleDissectionChange=(depth:number)=>{
  setDissectionDepth(depth);
  const visible=getDissectionSystems(depth);
  setState(s=>({...s,dissectionDepth:depth,visible,isolate:false}));
 };
 const fireNerveImpulse=()=>{
  setImpulseActive(true);
  setState(s=>({...s,impulseActive:true}));
  setTimeout(()=>{
   setImpulseActive(false);
   setState(s=>({...s,impulseActive:false}));
  },3500);
 };
 const [bookmarks,setBookmarks]=useState<BookmarkItem[]>(()=>{
  if(typeof window==='undefined')return[];
  try{const s=localStorage.getItem('human_atlas_bookmarks');return s?JSON.parse(s):[];}catch{return[];}
 });
 const [bookmarksOpen,setBookmarksOpen]=useState(false);
 const isBookmarked=useMemo(()=>chosen?bookmarks.some(b=>b.id===chosen.id):false,[chosen,bookmarks]);
 const toggleBookmark=(c:Concept,sysId:SystemId)=>{
  setBookmarks(prev=>{
   const exists=prev.some(b=>b.id===c.id);
   const next=exists?prev.filter(b=>b.id!==c.id):[...prev,{id:c.id,name:c.name,system:sysId,note:'',addedAt:Date.now()}];
   try{localStorage.setItem('human_atlas_bookmarks',JSON.stringify(next));}catch{}
   return next;
  });
 };
 const updateBookmarkNote=(id:string,note:string)=>{
  setBookmarks(prev=>{
   const next=prev.map(b=>b.id===id?{...b,note}:b);
   try{localStorage.setItem('human_atlas_bookmarks',JSON.stringify(next));}catch{}
   return next;
  });
 };
 const speak=(text:string)=>{
  if(typeof window==='undefined'||!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  if(speaking){setSpeaking(false);return;}
  const u=new SpeechSynthesisUtterance(text);
  u.rate=0.88;u.lang='en-US';
  u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);
  setSpeaking(true);window.speechSynthesis.speak(u);
 };
 useEffect(()=>{if(!details)setSpeaking(false);},[details]);
 useEffect(()=>{const abort=new AbortController();setProgress(0);setError('');setAtlas(null);setChosen(null);setDetails(false);setState({...initial,visible:DEFAULT_VISIBLE});fetch('/models/atlas.json',{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('The anatomy catalogue could not be loaded.');return r.json();}).then(data=>setAtlas(data as Atlas)).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[]);
 const parts=useMemo(()=>new Map(atlas?.parts.map(p=>[p.id,p])),[atlas]);
 const counts=useMemo(()=>Object.fromEntries(SYSTEMS.map(s=>[s.id,atlas?.parts.filter(p=>p.system===s.id).length??0])),[atlas]);
 const activeSystems=SYSTEMS.filter(s=>counts[s.id]>0);
 const selectedParts=state.selected.map(id=>parts.get(id)).filter(p=>!!p),selected=selectedParts[0],system=SYSTEMS.find(s=>s.id===selected?.system);
 const visibleCount=atlas?.parts.filter(p=>state.isolate?state.selected.includes(p.id):state.visible.includes(p.system)||state.selected.includes(p.id)).length??0;
 const dimensions=useMemo(()=>{
  if(selectedParts.length===0)return null;
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(const p of selectedParts){
   minX=Math.min(minX,p.bounds[0][0]);minY=Math.min(minY,p.bounds[0][1]);minZ=Math.min(minZ,p.bounds[0][2]);
   maxX=Math.max(maxX,p.bounds[1][0]);maxY=Math.max(maxY,p.bounds[1][1]);maxZ=Math.max(maxZ,p.bounds[1][2]);
  }
  const dx=(maxX-minX)*100,dy=(maxY-minY)*100,dz=(maxZ-minZ)*100;
  if(dx<0||dy<0||dz<0)return null;
  const fmt=(n:number)=>n<1?`${(n*10).toFixed(1)} mm`:`${n.toFixed(1)} cm`;
  return `${fmt(dx)} × ${fmt(dy)} × ${fmt(dz)}`;
 },[selectedParts]);
 const results=useMemo(()=>{
  if(!atlas)return[];
  const term=query.toLowerCase().trim();
  let base=atlas.concepts;
  if(systemFilter!=='all'){
   base=base.filter(c=>c.elements.some(id=>parts.get(id)?.system===systemFilter));
  }
  if(!term){
   if(systemFilter==='all'){
    return ['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea'].map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name)).filter((x):x is Concept=>!!x);
   }
   return base.slice(0,40);
  }
  return base.filter(c=>c.name.toLowerCase().includes(term)||c.id.toLowerCase().includes(term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);
 },[atlas,query,systemFilter,parts]);
 const choose=(c:Concept)=>{setChosen(c);setState(s=>({...s,selected:c.elements,isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 useEffect(()=>{if(!atlas)return;return registerAtlasTools(atlas,c=>flushSync(()=>choose(c)));},[atlas]);
 const choosePart=(id:string)=>{const p=parts.get(id);if(!p)return;setChosen({id:p.conceptId,name:p.name,elements:[id]});setState(s=>({...s,selected:[id],isolate:false,rotate:false}));setDetails(true);setPanel(null);};
 const toggle=(id:SystemId)=>{setDetails(false);setState(s=>({...s,selected:[],isolate:false,visible:s.visible.includes(id)?s.visible.filter(x=>x!==id):[...s.visible,id]}));};
 const reset=()=>{setState(s=>({...initial,visible:DEFAULT_VISIBLE,reset:s.reset+1}));setChosen(null);setDetails(false);setPanel(null);};
 const openPanel=(next:'layers'|'search')=>{setDetails(false);setPanel(p=>p===next?null:next);};
 const takeSnapshot=()=>window.dispatchEvent(new CustomEvent('atlas:screenshot'));
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   if(e.key==='/'){e.preventDefault();setPanel('search');setDetails(false);}
   else if(e.key==='?'||(e.shiftKey&&e.key==='/')){e.preventDefault();setHelp(h=>!h);}
   else if(e.key===' '){e.preventDefault();setState(s=>({...s,rotate:!s.rotate}));}
   else if(e.key==='r'||e.key==='R'){e.preventDefault();reset();}
   else if(e.key==='p'||e.key==='P'){e.preventDefault();takeSnapshot();}
   else if(e.key==='b'||e.key==='B'){e.preventDefault();setBookmarksOpen(o=>!o);}
   else if(e.key==='c'||e.key==='C'){e.preventDefault();toggleCadaverMode();}
   else if(e.key==='n'||e.key==='N'){e.preventDefault();fireNerveImpulse();}
   else if(e.key==='1'){e.preventDefault();setState(s=>({...s,view:'three-quarter',reset:s.reset+1,rotate:false}));}
   else if(e.key==='2'){e.preventDefault();setState(s=>({...s,view:'front',reset:s.reset+1,rotate:false}));}
   else if(e.key==='3'){e.preventDefault();setState(s=>({...s,view:'side',reset:s.reset+1,rotate:false}));}
   else if(e.key==='4'){e.preventDefault();setState(s=>({...s,view:'back',reset:s.reset+1,rotate:false}));}
   else if(e.key==='i'||e.key==='I'){if(state.selected.length>0){e.preventDefault();setState(s=>({...s,isolate:!s.isolate,explode:0}));}}
   else if(e.key==='l'||e.key==='L'){e.preventDefault();openPanel('layers');}
   else if(e.key==='Escape'){setPanel(null);setDetails(false);setAbout(false);setHelp(false);setBookmarksOpen(false);setImpulseInfoOpen(false);}
  };
  window.addEventListener('keydown',key);
  return()=>window.removeEventListener('keydown',key);
 },[state.selected.length,dissectionDepth]);
 return <main className="studio">
  {atlas&&<AnatomyScene atlas={atlas} state={{...state,inspectorOpen:details&&selectedParts.length>0}} onSelect={choosePart} onProgress={n=>{setProgress(n);if(n===100)setError('');}} onError={setError}/>}
  <div className="vignette"/>
  <header className="identity"><div className="eyebrow"><span className="status-dot"/> INTERACTIVE ANATOMY</div><h1>Human Atlas<Badge variant="outline" className="edition">3D</Badge></h1><div className="identity-meta">{atlas?atlas.parts.length.toLocaleString():'2,234'} modeled pieces <span>·</span> BodyParts3D</div></header>
  <nav className="top-actions" aria-label="Explorer panels"><Button variant="ghost" className={`cadaver-toggle-btn ${state.cadaverMode?'active':''}`} onClick={toggleCadaverMode} title="Virtual Cadaver Dissection Lab (C)" aria-label="Virtual Cadaver Dissection Lab"><Scissors size={18}/><span>Cadaver Lab</span>{state.cadaverMode&&<span className="live-indicator"/>}</Button><Button variant="ghost" className={panel==='search'?'active':''} onClick={()=>openPanel('search')} aria-label="Search anatomy"><Search size={18}/><span>Find a structure</span><kbd>/</kbd></Button><Button variant="ghost" className="icon-button bookmark-top-btn" aria-label="Saved bookmarks" title="Bookmarks (B)" onClick={()=>{setDetails(false);setPanel(null);setBookmarksOpen(true);}}><Bookmark size={18} fill={bookmarks.length>0?'currentColor':'none'}/>{bookmarks.length>0&&<span className="top-badge">{bookmarks.length}</span>}</Button><Button variant="ghost" className="icon-button" aria-label="Take snapshot" title="Save snapshot (P)" onClick={takeSnapshot}><Camera size={18}/></Button><Button variant="ghost" className="icon-button" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" onClick={()=>{setDetails(false);setPanel(null);setHelp(true);}}><Keyboard size={18}/></Button><Button variant="ghost" className="icon-button" aria-label="About this atlas" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}><Info size={18}/></Button></nav>
  {state.cadaverMode&&<section className="cadaver-panel glass" aria-label="Cadaver dissection tools"><div className="cadaver-panel-header"><div className="cadaver-title"><Scissors size={16}/><span>VIRTUAL CADAVER DISSECTION</span><Badge variant="outline" className="layer-badge">{DISSECTION_STAGES.find(st=>Math.abs(st.depth-dissectionDepth)<=12)?.label??'Custom Depth'}</Badge></div><div className="cadaver-actions"><Button variant="ghost" className={`impulse-btn ${impulseActive?'firing':''}`} onClick={fireNerveImpulse} title="Simulate action potential & reflex arc (N)"><Zap size={15}/><span>{impulseActive?'Signal Propagating…':'Simulate Nerve Signal'}</span></Button><Button variant="ghost" className="icon-button" onClick={()=>setImpulseInfoOpen(true)} title="Reflex Arc Information"><Info size={15}/></Button></div></div><div className="dissection-slider-row"><div className="slider-label-group"><label>Dissection Layer Peel</label><span className="depth-val">{dissectionDepth}%</span></div><Slider min={0} max={100} step={1} value={[dissectionDepth]} onValueChange={v=>handleDissectionChange(Array.isArray(v)?v[0]:v)}/><div className="dissection-stages-chips">{DISSECTION_STAGES.map(st=><Button key={st.depth} variant="ghost" className={`stage-chip ${Math.abs(dissectionDepth-st.depth)<=12?'active':''}`} onClick={()=>handleDissectionChange(st.depth)} title={st.description}>{st.label}</Button>)}</div></div></section>}
  <section className={`layers-panel glass ${panel==='layers'?'mobile-open':''}`} aria-label="Anatomical layers">
   <div className="panel-heading"><span>Systems</span><Button variant="ghost" className="mobile-only icon-button" onClick={()=>setPanel(null)} aria-label="Close systems"><X size={18}/></Button><Badge variant="secondary" className="desktop-only small-number">{activeSystems.length}</Badge></div>
   <div className="layer-presets"><Button variant="ghost" aria-pressed={activeSystems.every(x=>state.visible.includes(x.id))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:activeSystems.map(x=>x.id)}))}>All</Button><Button variant="ghost" aria-pressed={state.visible.length===1&&state.visible[0]==='skeletal'} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['skeletal']}))}>Skeleton</Button><Button variant="ghost" aria-pressed={state.visible.length===6&&['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].every(id=>state.visible.includes(id as SystemId))} onClick={()=>setState(s=>({...s,selected:[],isolate:false,visible:['cardiac','respiratory','digestive','urinary','endocrine','reproductive']}))}>Organs</Button></div>
   <div className="system-list">{activeSystems.map(s=><div className={`system-row ${state.visible.includes(s.id)?'enabled':''}`} key={s.id}><Button variant="ghost" className="system-name" title={`Show only ${s.name.toLowerCase()}`} onClick={()=>setState(v=>({...v,visible:[s.id],isolate:false,selected:[]}))}><span className="system-dot" style={{background:s.color}}/>{s.name}<span className="system-count">{counts[s.id]}</span></Button><Switch checked={state.visible.includes(s.id)} onCheckedChange={()=>toggle(s.id)} aria-label={`Show ${s.name.toLowerCase()}`} /></div>)}</div>
   <div className="panel-foot"><span>{visibleCount.toLocaleString()} pieces visible</span><Button variant="ghost" onClick={()=>setState(s=>({...s,visible:[],selected:[],isolate:false}))}>Hide all</Button></div>
  </section>
  {panel==='search'&&<section className="search-panel glass" aria-label="Find anatomy"><div className="panel-heading"><span>Find a structure</span><Button variant="ghost" className="icon-button" onClick={()=>setPanel(null)} aria-label="Close search"><X size={18}/></Button></div><div className="search-system-filters"><Button variant="ghost" className={systemFilter==='all'?'active':''} onClick={()=>setSystemFilter('all')}>All</Button>{['skeletal','cardiac','nervous','respiratory','digestive','muscular'].map(sysId=><Button key={sysId} variant="ghost" className={systemFilter===sysId?'active':''} onClick={()=>setSystemFilter(systemFilter===sysId?'all':sysId as SystemId)}>{SYSTEMS.find(s=>s.id===sysId)?.name}</Button>)}</div><Combobox<Concept> items={results} value={null} onValueChange={value=>{if(value)choose(value);}} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={c=>c.name} filter={null} open onOpenChange={open=>{if(!open)setPanel(null);}}><ComboboxInput autoFocus placeholder="Heart, femur, cranial nerve…" aria-label="Search named anatomical structures" showTrigger={false}/><ComboboxContent className="anatomy-search-results"><ComboboxEmpty>No structures match your search.</ComboboxEmpty><ComboboxList>{(c:Concept)=><ComboboxItem key={c.id} value={c}><span className="search-result-name">{c.name}</span><span className="small-number">{c.elements.length} {c.elements.length===1?'piece':'pieces'}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox><p className="search-note">{query?'Showing up to 80 matches. Refine your search to find smaller structures.':'Start with a major organ, or search every named structure.'}</p></section>}
  <nav className="view-controls glass" aria-label="Camera controls">{(['three-quarter','front','side','back'] as View[]).map((v,i)=><Button variant="ghost" key={v} className={state.view===v?'active':''} aria-pressed={state.view===v} disabled={state.explode>.8&&v!=='front'} onClick={()=>setState(s=>({...s,view:v,reset:s.reset+1,rotate:false}))} title={`${v} view`} aria-label={`${v} view`}><span>{['¾','F','S','B'][i]}</span></Button>)}<i/><Button variant="ghost" disabled={state.explode>=.4} aria-label={state.rotate?'Pause rotation':'Rotate body'} title="Auto rotate" className={state.rotate?'active':''} onClick={()=>setState(s=>({...s,rotate:!s.rotate}))}>{state.rotate?<Pause size={17}/>:<RotateCw size={18}/>}</Button><Button variant="ghost" aria-label="Reset view and layers" title="Reset" onClick={reset}><RotateCcw size={17}/></Button></nav>
  <div className="scene-caption"><span className="caption-line"/><span>{state.isolate?(chosen?.name??'SELECTED STRUCTURE'):state.explode>.95?'ANATOMICAL INVENTORY':state.explode>.05?'SEPARATED STRUCTURES':state.cadaverMode?'VIRTUAL CADAVER LAB · SUPINE DISSECTION':'ADULT HUMAN · MALE'}</span><span className="caption-line"/></div>
   {state.explode<.1&&!state.isolate&&<div className="region-selector glass" role="toolbar" aria-label="Anatomical region focus">{(['all','head','thorax','abdomen','pelvis'] as const).map(reg=><Button key={reg} variant="ghost" className={(state.region??'all')===reg?'active':''} onClick={()=>setState(s=>({...s,region:reg,reset:s.reset+1,rotate:false}))}>{reg==='all'?'Full Body':reg.charAt(0).toUpperCase()+reg.slice(1)}</Button>)}</div>}
  <div className="bottom-dock glass"><Button variant="ghost" className="mobile-only dock-layers" onClick={()=>openPanel('layers')} aria-label="Open system layers"><Layers3 size={20}/><span>Systems</span></Button><div className="explode-control"><div className="explode-label"><label id="explode-label">Explode anatomy</label><output>{Math.round(state.explode*100)}<span>%</span></output></div><Slider aria-labelledby="explode-label" min={0} max={100} step={1} value={[state.explode*100]} onValueChange={v=>setState(s=>({...s,explode:(Array.isArray(v)?v[0]:v)/100,view:(Array.isArray(v)?v[0]:v)>80?'front':s.view,rotate:false}))}/><div className="slider-endpoints"><span>Assembled</span><span>Every piece</span></div></div><Button variant="ghost" className="dock-reset" onClick={reset} aria-label="Assemble and reset"><RotateCcw size={18}/><span>Reset</span></Button></div>
  <footer className="studio-footer"><span>{state.explode>.8?'Drag to pan':'Drag to orbit'} <b>·</b> Pinch to zoom <b>·</b> Tap to inspect</span><Button variant="ghost" onClick={()=>{setDetails(false);setPanel(null);setAbout(true);}}>Source & credits <ArrowUpRight size={12}/></Button></footer>
  {progress<100&&!error&&<div className="loading glass" role="status"><Activity size={18}/><div><strong>Preparing the anatomy</strong><span>{progress}% · Loading {atlas?.parts.length.toLocaleString()??'2,234'} pieces</span><div className="loading-track"><i style={{width:`${progress}%`}}/></div></div></div>}
  {error&&<div className="loading glass error" role="alert"><p>{error}</p><Button variant="ghost" onClick={()=>location.reload()}>Reload viewer</Button></div>}
  <Sheet open={details&&selectedParts.length>0} modal={false} disablePointerDismissal onOpenChange={setDetails}><SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate?'is-isolated':''}`} showCloseButton={true}><div className="detail-header"><div className="detail-accent" style={{background:system?.color}}/><div className="eyebrow">{system?.name??'ANATOMY'}</div><div className="detail-title-wrapper"><SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">{chosen?.name}</SheetTitle><div style={{display:'flex',gap:4}}>{chosen?.name&&<Button variant="ghost" className={`pronounce-btn ${speaking?'speaking':''}`} onClick={()=>speak(chosen.name)} title="Pronounce name" aria-label="Pronounce name"><Volume2 size={16}/></Button>}{chosen&&selected&&<Button variant="ghost" className={`pronounce-btn ${isBookmarked?'speaking':''}`} onClick={()=>toggleBookmark(chosen,selected.system)} title={isBookmarked?'Remove bookmark':'Bookmark structure'} aria-label={isBookmarked?'Remove bookmark':'Bookmark structure'}><Bookmark size={16} fill={isBookmarked?'currentColor':'none'}/></Button>}</div></div></div><div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}><SheetDescription className="structure-description">{chosen&&selected?explanation(chosen.name,selected.system):''}</SheetDescription>{chosen&&!EXPLANATIONS[chosen.name.toLowerCase()]&&<span className="context-note">System overview · structure identified from source anatomy</span>}{isBookmarked&&chosen&&<div className="note-area"><label>YOUR STUDY NOTES</label><textarea placeholder="Add study note or revision reminder..." value={bookmarks.find(b=>b.id===chosen.id)?.note??''} onChange={e=>updateBookmarkNote(chosen.id,e.target.value)}/></div>}<div className="structure-meta"><span>Atlas reference<strong>{chosen?.id}</strong></span><span>Selected pieces<strong>{state.selected.length.toLocaleString()}</strong></span>{dimensions&&<span>Estimated size<strong>{dimensions}</strong></span>}</div>{selectedParts.length>1&&<div className="member-list"><h3>Included structures</h3>{selectedParts.slice(0,50).map(p=><Button variant="ghost" key={p.id} onClick={()=>choosePart(p.id)}><span>{p.name}</span><ChevronRight size={14}/></Button>)}{selectedParts.length>50&&<p>And {selectedParts.length-50} more modeled pieces.</p>}</div>}<a className="source-link" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">View anatomical source <ArrowUpRight size={14}/></a></div><div className="detail-actions"><Button className={`primary-action ${state.isolate?'active':''}`} onClick={()=>setState(s=>({...s,isolate:!s.isolate,explode:0}))}><Focus size={18}/>{state.isolate?'Show surrounding anatomy':'Isolate structure'}<ChevronRight size={16}/></Button><Button variant="ghost" className="secondary-action" onClick={()=>{setState(s=>({...s,selected:[],isolate:false}));setDetails(false);}}>Clear selection</Button></div></SheetContent></Sheet>
  <Sheet open={about} onOpenChange={setAbout}><SheetContent className="about-sheet glass"><div className="eyebrow">SOURCE & SCOPE</div><SheetTitle className="structure-title">A body, revealed.</SheetTitle><SheetDescription>Explore the adult male reference anatomy from BodyParts3D.</SheetDescription><div className="about-copy"><p><strong>Male · BodyParts3D</strong><br/>2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.</p><p>This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.</p><p>Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.</p><h3>Source</h3><p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Dataset license <ArrowUpRight size={14}/></a><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Original geometry & metadata <ArrowUpRight size={14}/></a><a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">Read the source publication <ArrowUpRight size={14}/></a></div></SheetContent></Sheet>
  <Sheet open={bookmarksOpen} onOpenChange={setBookmarksOpen}><SheetContent className="about-sheet glass"><div className="eyebrow">SAVED STRUCTURES</div><SheetTitle className="structure-title">Bookmarks & Notes</SheetTitle><SheetDescription>Review your saved anatomical parts and revision notes.</SheetDescription>{bookmarks.length===0?<div className="bookmark-empty"><p>No bookmarked structures yet.</p><p style={{fontSize:12,marginTop:6,opacity:.8}}>Click the bookmark icon on any structure to save it for quick revision.</p></div>:<div className="bookmark-list">{bookmarks.map(b=><div className="bookmark-card" key={b.id}><div className="bookmark-header"><Button variant="ghost" onClick={()=>{const c=atlas?.concepts.find(x=>x.id===b.id);if(c){choose(c);setBookmarksOpen(false);}}}>{b.name}</Button><Button variant="ghost" style={{minWidth:28,minHeight:28,padding:0,color:'#8292a0'}} onClick={()=>setBookmarks(prev=>prev.filter(x=>x.id!==b.id))} title="Remove bookmark" aria-label="Remove bookmark"><Trash2 size={15}/></Button></div><input className="bookmark-note-input" placeholder="Add study note..." value={b.note??''} onChange={e=>updateBookmarkNote(b.id,e.target.value)}/></div>)}</div>}</SheetContent></Sheet>
  <Sheet open={impulseInfoOpen} onOpenChange={setImpulseInfoOpen}><SheetContent className="about-sheet glass"><div className="eyebrow">NEUROPHYSIOLOGY & CLINICAL REFLEX</div><SheetTitle className="structure-title">Nerve Impulse & Reflex Arc</SheetTitle><SheetDescription>How action potentials propagate through the nervous system during injury.</SheetDescription><div className="impulse-modal-content"><div className="impulse-step"><span className="impulse-step-num">1</span><div><strong>Nociceptor Activation (Receptor)</strong><br/>Mechanical trauma, heat, or injury triggers sensory nerve endings in peripheral tissues.</div></div><div className="impulse-step"><span className="impulse-step-num">2</span><div><strong>Afferent Conduction (Sensory Nerve)</strong><br/>Sodium/Potassium ion fluxes generate a depolarizing action potential traveling along sensory axons.</div></div><div className="impulse-step"><span className="impulse-step-num">3</span><div><strong>Spinal Cord Synapse (Integration)</strong><br/>Signals enter the dorsal horn of the spinal cord via posterior root ganglion and synapse with interneurons.</div></div><div className="impulse-step"><span className="impulse-step-num">4</span><div><strong>Ascending Pain Pathway (Spinothalamic Tract)</strong><br/>Axons cross the midline and ascend to the thalamus and somatosensory cortex, registering conscious pain perception.</div></div><div className="impulse-step"><span className="impulse-step-num">5</span><div><strong>Efferent Motor Reflex (Withdrawal)</strong><br/>Before pain reaches the conscious brain, anterior motor neurons fire efferent impulses contracting flexor muscles to pull the limb away.</div></div></div></SheetContent></Sheet>
  <Sheet open={help} onOpenChange={setHelp}><SheetContent className="about-sheet glass"><div className="eyebrow">QUICK NAVIGATION</div><SheetTitle className="structure-title">Keyboard Shortcuts</SheetTitle><SheetDescription>Use these key combinations for rapid anatomy inspection.</SheetDescription><div className="shortcuts-grid"><div className="shortcut-row"><kbd>/</kbd><span>Find anatomical structure</span></div><div className="shortcut-row"><kbd>Space</kbd><span>Toggle 360° auto-rotation</span></div><div className="shortcut-row"><kbd>1</kbd> – <kbd>4</kbd><span>Camera views (¾, Front, Side, Back)</span></div><div className="shortcut-row"><kbd>C</kbd><span>Toggle Virtual Cadaver Dissection Lab</span></div><div className="shortcut-row"><kbd>N</kbd><span>Simulate Nerve Impulse & Action Potential</span></div><div className="shortcut-row"><kbd>B</kbd><span>View bookmarks and study notes</span></div><div className="shortcut-row"><kbd>P</kbd><span>Capture high-resolution PNG snapshot</span></div><div className="shortcut-row"><kbd>R</kbd><span>Reset camera and scene</span></div><div className="shortcut-row"><kbd>I</kbd><span>Isolate selected structure</span></div><div className="shortcut-row"><kbd>L</kbd><span>Toggle system layers panel</span></div><div className="shortcut-row"><kbd>?</kbd><span>Show keyboard shortcuts</span></div><div className="shortcut-row"><kbd>Esc</kbd><span>Close active panel or drawer</span></div></div></SheetContent></Sheet>
  </main>;
}
