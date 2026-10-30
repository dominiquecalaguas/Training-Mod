'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { Dialog } from '@/components/ui/dialog';
import { BoltoButton, BoltoDialog } from './components';
import { emptyDraft, restoreDraft, serializeDraft, STORAGE_KEY, sampleDraft, initialDraft, offerStatus, type Draft } from './draft';
import { DRAFT_KEY, parseDraft } from './compensation/model';
import styles from './flow.module.css';

type Store = { draft:Draft; update:(recipe:(d:Draft)=>Draft)=>void; save:()=>boolean; simulate:()=>boolean; warning:string };
const Context = createContext<Store|null>(null);
export function useOfferDraft() { const value = useContext(Context); if(!value) throw new Error('Offer draft provider is missing'); return value; }
export function DraftProvider({children}:{children:ReactNode}) {
 const [store,setStore] = useState<Store|null>(null);
 useEffect(()=>{
  // Bolto drafts must stay local, including the application's automatic analytics/session replay.
  const previousAnalytics = { autocapture:posthog.config.autocapture, capture_pageview:posthog.config.capture_pageview, capture_exceptions:posthog.config.capture_exceptions, disable_session_recording:posthog.config.disable_session_recording, before_send:posthog.config.before_send };
  posthog.stopSessionRecording();
  posthog.set_config({autocapture:false,capture_pageview:false,capture_exceptions:false,disable_session_recording:true,before_send:()=>null});
  let draft = sampleDraft(), warning = '';
  try {
   const raw = localStorage.getItem(STORAGE_KEY);
   const restored = restoreDraft(raw);
   if(restored) draft = restored;
   else if(raw !== null) { draft = initialDraft(raw); warning = 'Saved draft is malformed or from an unsupported version. It has not been overwritten; edits will save a new draft.'; }
   else {
    const legacy = parseDraft(localStorage.getItem(DRAFT_KEY));
    if(legacy) { draft = emptyDraft(); draft.compensation = legacy; warning='Previous compensation draft restored. Complete the remaining offer steps.'; }
    else draft = initialDraft(null);
    localStorage.setItem(STORAGE_KEY,serializeDraft(draft));
   }
  } catch { warning='Browser storage is unavailable. Changes will only last for this visit.'; }
  const save = () => { try { localStorage.setItem(STORAGE_KEY,serializeDraft(draft)); return true; } catch { return false; } };
  const publish = () => setStore({draft,warning,save,update,simulate});
  function update(recipe:(d:Draft)=>Draft) { draft = recipe(draft); draft = {...draft,review:{...draft.review,sent:false}}; warning = save() ? '' : 'Autosave unavailable. Keep this page open to retain your changes.'; publish(); }
  function simulate() { if(!offerStatus(draft).ready) { publish(); return false; } draft={...draft,review:{...draft.review,sent:true}}; save(); publish(); return true; }
  const sync = (event:StorageEvent) => { if(event.key===STORAGE_KEY) { const next=restoreDraft(event.newValue); if(next) { draft=next; publish(); } } };
  publish(); window.addEventListener('storage',sync);
  return ()=>{ window.removeEventListener('storage',sync); posthog.set_config(previousAnalytics); };
 },[]);
 if(!store) return <div aria-busy="true" className={styles.loading}>Loading offer draft…</div>;
 return <Context.Provider value={store}><div className="ph-no-capture" data-private>{children}</div><DemoControls /></Context.Provider>;
}
function DemoControls() {
 const {update,warning} = useOfferDraft(); const [action,setAction]=useState<''|'reset'|'sample'>('');
 return <aside className={styles.demo} aria-label="Prototype demo controls"><span>Fictional prototype · changes autosave locally</span><button onClick={()=>setAction('reset')}>Reset draft</button><button onClick={()=>setAction('sample')}>Load fictional sample</button>{warning && <p role="status">{warning}</p>}
 <Dialog open={!!action} onOpenChange={open=>{if(!open)setAction('');}}><BoltoDialog title={action==='reset'?'Reset this draft?':'Load fictional sample?'} description="This replaces the current draft in this browser. Your current entries will be discarded."><BoltoButton secondary onClick={()=>setAction('')}>Cancel</BoltoButton><BoltoButton onClick={()=>{update(()=>action==='reset'?emptyDraft():sampleDraft());setAction('');}}>Replace draft</BoltoButton></BoltoDialog></Dialog></aside>;
}
