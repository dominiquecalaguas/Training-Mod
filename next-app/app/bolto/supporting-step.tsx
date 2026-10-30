'use client';
import { useState } from 'react';
import Link from 'next/link';
import { OfferBreadcrumb } from './breadcrumb';
import { wizardSteps } from './wizard-navigation';
import { useRouter } from 'next/navigation';
import { Asset,BoltoButton } from './components';
import { Field } from './compensation/controls';
import { useOfferDraft } from './draft-provider';
import { sections, validateOffer, type Section } from './draft';
import review from './review.module.css';
import styles from './flow.module.css';

export function SupportingStep({section}:{section:Exclude<Section,'compensation'>}) {
 const {draft,update,save} = useOfferDraft(); const router=useRouter();
 const [touched,setTouched]=useState<Record<string,boolean>>({});const [attempted,setAttempted]=useState(false);const [message,setMessage]=useState('');
 const issues=validateOffer(draft).filter(i=>i.section===section);
 const error=(key:string)=>touched[key]||attempted?issues.find(i=>i.field===key)?.message:undefined;
 function change(key:string,value:string) { update(d=>section==='candidate' && ['payType','startDate','endDate'].includes(key)?{...d,compensation:{...d.compensation,[key]:value}}:{...d,[section]:{...d[section],[key]:value}}); }
 const value=(key:string)=>section==='candidate' && ['payType','startDate','endDate'].includes(key)?String(draft.compensation[key as keyof typeof draft.compensation]):String((draft[section] as Record<string,string>)[key]);
 const blur=(key:string)=>()=>setTouched(t=>({...t,[key]:true}));
 const input=(key:string,label:string,type='text')=><Field className={styles.field} key={key} name={key} label={label} value={value(key)} type={type} onChange={e=>change(key,e.target.value)} onBlur={blur(key)} error={error(key)} maxLength={150} />;
 const select=(key:string,label:string,options:string[][])=><div className={styles.field} key={key}><label htmlFor={key}>{label} *</label><select id={key} name={key} value={value(key)} onChange={e=>change(key,e.target.value)} onBlur={blur(key)} aria-required aria-invalid={!!error(key)} aria-describedby={error(key)?`${key}-error`:undefined}><option value="">Select…</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>{error(key)&&<p id={`${key}-error`} className={styles.error}>{error(key)}</p>}</div>;
 const order:Section[]=wizardSteps.flatMap(step=>step.section ? [step.section] : []); const next=order[order.indexOf(section)+1];
 return <div className={review.container}><header><Asset name="logo" alt="Bolto"/><OfferBreadcrumb /></header><main><div className={review.intro}><h1 className={review.title}>{sections[section].title}</h1><p className={review.subtitle}>Enter fictional offer details. Fields marked * are required.</p></div><form noValidate className={styles.form} onSubmit={e=>{e.preventDefault();setAttempted(true);if(issues.length){setMessage('Correct the highlighted fields before continuing.'); e.currentTarget.querySelector<HTMLElement>(`[name="${issues[0].field}"]`)?.focus();return;}router.push(next?sections[next].href:'/bolto');}}>
 {section==='template'&&<>{select('classification','Employment / letter classification',[['W-2','W-2'],['1099','1099']])}{select('kind','Template type',[['Standard','Standard'],['Concise','Concise'],['Company template','Company template']])}<p>Letter language is illustrative. Company template content is unavailable and will be identified as a prototype placeholder.</p></>}
 {section==='candidate'&&<>{input('name','Candidate full name')}{input('email','Candidate email','email')}{input('role','Job title')}{select('payType','Employment type',[['full-time','Full-time'],['contract','Contract']])}{input('startDate','Start date','date')}{draft.compensation.payType==='contract'&&input('endDate','Contract end date','date')}{input('manager','Reporting manager')}{input('location','Work location')}</>}
 {section==='hire'&&<><p>Demo applicability: W-2 drafts require explicit FLSA and I-9 selections; 1099 drafts omit these fields. This does not determine legal or compliance requirements.</p>{select('payroll','Payroll group',[['US Salaried','US Salaried'],['US Payroll','US Payroll'],['Contractor payments','Contractor payments']])}{draft.template.classification==='W-2'?<>{select('flsa','FLSA classification',[['Exempt','Exempt'],['Non-exempt','Non-exempt']])}{select('i9','I-9 required',[['Yes','Yes'],['No','No']])}</>:<p>For this prototype, FLSA and I-9 fields apply to W-2 drafts only. This is a demo applicability rule, not a compliance determination.</p>}{select('autoInvite','Automatically invite to Bolto',[['Enabled','Yes'],['Disabled','No']])}</>}
 {section==='terms'&&<>{input('expires','Offer expiration','date')}{input('sender','Sender name')}{input('senderTitle','Sender title')}<p>Prototype rule: expiration must be a future date before the proposed start date.</p></>}
 <div className={styles.actions}><BoltoButton type="button" secondary onClick={()=>{setMessage(save()?'Draft saved locally.':'Browser storage unavailable.');}}>Save as draft</BoltoButton><BoltoButton type="submit">{next?`Next: ${sections[next].title}`:'Review & send'}</BoltoButton>{order.indexOf(section)>0&&<Link href={sections[order[order.indexOf(section)-1]].href}>Back</Link>}</div><p role="status">{message}</p></form></main></div>;
}
