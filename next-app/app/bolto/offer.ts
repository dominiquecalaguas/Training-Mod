import type { Draft } from './draft';
import { dateValue, numeric } from './compensation/model';
export function money(value:string, decimals=0) {
 const n=numeric(value);
 if(n===null)return value;
 const precision=Math.min(20,value.split('.')[1]?.length ?? 0);
 return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:decimals,maximumFractionDigits:Math.max(decimals,precision)}).format(n);
}
export function dateLabel(value:string) { const time=dateValue(value); return time===null?value:new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(time); }
export function reviewOffer(d:Draft) {
 const c=d.compensation;
 return {...d.candidate,...d.terms,...d.hire,letterType:[d.template.kind,d.template.classification].filter(Boolean).join(' • '), employment:[c.payType==='full-time'?'Full-time':c.payType==='contract'?'Contract':'',d.template.classification,d.candidate.location].filter(Boolean).join(' • '),startDate:c.startDate,salary:c.payType==='full-time'?c.salary:c.contractType==='hourly'?c.hourlyRate:c.contractType==='fixed'?c.projectFee:'',bonus:c.bonus,options:c.equityType==='rsu'?c.units:c.options,exercisePrice:c.exercisePrice,vesting:c.vesting?({'equal':'4 years - Equal','front':'4 years - Front-loaded','back':'4 years - Back-loaded'}[c.vesting]):'',flsa:d.template.classification==='1099'?'Not applicable (prototype)':d.hire.flsa,i9:d.template.classification==='1099'?'Not applicable (prototype)':d.hire.i9,draft:d};
}
export type Offer = ReturnType<typeof reviewOffer>;
export function letterFacts(offer:Offer) {
 const d=offer.draft,c=d.compensation;
 const base=c.payType==='full-time'?`Annual base salary: ${money(c.salary)}.`:c.contractType==='hourly'?`Hourly rate: ${money(c.hourlyRate)} per hour.`:`Fixed project fee: ${money(c.projectFee)}.`;
 return [base,c.bonusIncluded?`Signing bonus: ${money(c.bonus)}, payable ${c.bonusTiming==='first'?'with the first paycheck':dateLabel(c.bonusDate)}. ${c.conditions}`:'',c.equityIncluded?`${c.equityType==='rsu'?`${numeric(c.units)?.toLocaleString('en-US')} RSUs`:`${numeric(c.options)?.toLocaleString('en-US')} stock options at ${money(c.exercisePrice,2)} per share`}. Vesting: ${offer.vesting}.`:''].filter(Boolean);
}
