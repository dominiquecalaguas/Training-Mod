import { z } from 'zod';
import { dateValue, emptyCompensation, numeric, validate, type Compensation } from './compensation/model';

export const sections = {
  template: { title: 'Template', href: '/bolto/template' },
  candidate: { title: 'Candidate & role', href: '/bolto/candidate' },
  compensation: { title: 'Compensation', href: '/bolto/compensation' },
  hire: { title: 'Hire setup (Internal use only)', href: '/bolto/hire-setup' },
  terms: { title: 'Offer terms & sender', href: '/bolto/offer-terms' },
} as const;
export type Section = keyof typeof sections;
const text = z.string().max(10000);
const schema = z.object({
 template: z.object({ classification: z.enum(['', 'W-2', '1099']), kind: z.enum(['', 'Standard', 'Concise', 'Company template']) }),
 candidate: z.object({ name: text, email: text, role: text, manager: text, location: text }),
 compensation: z.object(Object.fromEntries(Object.entries(emptyCompensation).map(([k,v]) => [k, typeof v === 'boolean' ? z.boolean() : text]))),
 hire: z.object({ payroll: text, flsa: z.enum(['', 'Exempt', 'Non-exempt']), i9: z.enum(['', 'Yes', 'No']), autoInvite: z.enum(['', 'Enabled', 'Disabled']) }),
 terms: z.object({ expires: text, sender: text, senderTitle: text }),
 review: z.object({ note: text, sent: z.boolean() }),
});
export type Draft = Omit<z.infer<typeof schema>, 'compensation'> & { compensation: Compensation };
export const emptyDraft = (): Draft => ({ template: { classification: '', kind: '' }, candidate: { name:'',email:'',role:'',manager:'',location:'' }, compensation: { ...emptyCompensation, startDate: '' }, hire: { payroll:'',flsa:'',i9:'',autoInvite:'' }, terms:{ expires:'',sender:'',senderTitle:'' }, review:{ note:'',sent:false } });
export const STORAGE_KEY = 'bolto:offer-draft:v2';
const numericKeys = ['salary','hourlyRate','projectFee','weeklyHours','bonus','options','units','exercisePrice','optionsSharePrice','rsuSharePrice'] as const;
/** Numeric terms are persisted as numbers; editing lexemes preserve incomplete/invalid input and decimal precision. */
export function serializeDraft(draft: Draft) {
 const compensation: Record<string, unknown> = { ...draft.compensation };
 const inputDrafts: Record<string,string> = {};
 for (const key of numericKeys) {
   const raw = draft.compensation[key].replaceAll(',', '');
   compensation[key] = numeric(raw);
   if (raw !== String(compensation[key] ?? '')) inputDrafts[key] = raw;
 }
 return JSON.stringify({ version:2, savedAt:Date.now(), data:{...draft, compensation}, inputDrafts });
}
export function restoreDraft(raw: string | null): Draft | null {
 if (!raw) return null;
 try {
  const envelope = z.object({ version:z.literal(2), data:z.record(z.string(), z.unknown()), inputDrafts:z.record(z.string(),text).optional() }).parse(JSON.parse(raw));
  const comp = z.record(z.string(),z.unknown()).parse(envelope.data.compensation);
  for(const key of numericKeys) {
   const value = comp[key];
   if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) return null;
   comp[key] = envelope.inputDrafts?.[key] ?? (value === null ? '' : String(value));
  }
  const result = schema.parse({...envelope.data, compensation:comp});
  const c = result.compensation as Compensation;
  if (!['','full-time','contract'].includes(c.payType) || !['','hourly','fixed'].includes(c.contractType) || !['','rsu','options'].includes(c.equityType) || !['','first','custom'].includes(c.bonusTiming) || !['','equal','front','back'].includes(c.vesting)) return null;
  return result as Draft;
 } catch { return null; }
}
export function today() { return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export type Issue = { section: Section; field:string; message:string; invalid:boolean };
export function validateOffer(d: Draft, currentDate = today()): Issue[] {
 const issues: Issue[] = [];
 const add = (section:Section, field:string, message:string, invalid=false) => issues.push({section,field,message,invalid});
 const required = (section:Section, field:string, value:string, label:string) => { if(!value.trim()) add(section,field,`${label} is required.`); };
 required('template','classification',d.template.classification,'Classification'); required('template','kind',d.template.kind,'Template type');
 for(const [key,label] of Object.entries({name:'Candidate name',email:'Email',role:'Job title',manager:'Reporting manager',location:'Work location'})) required('candidate',key,d.candidate[key as keyof Draft['candidate']],label);
 if(d.candidate.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.candidate.email)) add('candidate','email','Enter a valid email address.',true);
 const c = d.compensation;
 required('candidate','payType',c.payType,'Employment type');
 if(dateValue(c.startDate) === null || c.startDate < '1900-01-01' || c.startDate > '9995-12-31') add('candidate','startDate','Enter a valid start date.',!!c.startDate);
 if(c.payType === 'contract') {
  if(dateValue(c.endDate) === null) add('candidate','endDate','Enter a valid contract end date.',!!c.endDate);
  else if(dateValue(c.startDate) !== null && c.endDate <= c.startDate) add('candidate','endDate','Contract end date must be after the start date.',true);
 }
 for(const [field,message] of Object.entries(validate(c))) {
  // Visualization assumptions never block legal offer completion. Their own form still shows errors.
  if(['startDate','weeklyHours','optionsSharePrice','rsuSharePrice','endDate'].includes(field)) continue;
  const labels: Record<string,string> = {salary:'Base salary',hourlyRate:'Hourly rate',projectFee:'Project fee',bonus:'Signing bonus',options:'Number of options',units:'Number of units',exercisePrice:'Exercise price',vesting:'Vesting schedule',equityType:'Equity type',bonusTiming:'Bonus payment timing',bonusDate:'Bonus payment date',contractType:'Compensation type',payType:'Pay type'};
  add('compensation',field,`${labels[field] ?? field}: ${message}`, !!String(c[field as keyof Compensation]));
 }
 if(c.payType === 'contract' && issues.some(i=>i.field==='endDate')) add('compensation','endDate',issues.find(i=>i.field==='endDate')!.message,!!c.endDate);
 required('hire','payroll',d.hire.payroll,'Payroll group');
 if(d.template.classification === 'W-2') { required('hire','flsa',d.hire.flsa,'FLSA classification'); required('hire','i9',d.hire.i9,'I-9 selection'); }
 required('hire','autoInvite',d.hire.autoInvite,'Automatic invitation selection');
 required('terms','sender',d.terms.sender,'Sender name'); required('terms','senderTitle',d.terms.senderTitle,'Sender title');
 const expiration = dateValue(d.terms.expires);
 if(expiration === null) add('terms','expires','Enter a valid offer expiration date.',!!d.terms.expires);
 else if(d.terms.expires <= currentDate) add('terms','expires','Choose a future expiration date.',true);
 else if(dateValue(c.startDate) !== null && d.terms.expires >= c.startDate) add('terms','expires','Offer expiration must be before the start date.',true);
 return issues;
}
export function offerStatus(d: Draft, currentDate = today()) {
 const issues = validateOffer(d,currentDate);
 const count = Object.keys(sections).filter(s=>!issues.some(i=>i.section===s)).length;
 const hasInput = !!(d.template.kind || d.template.classification || Object.values(d.candidate).some(Boolean) || d.compensation.payType || d.compensation.bonusIncluded || d.compensation.equityIncluded || Object.values(d.terms).some(Boolean) || Object.values(d.hire).some(Boolean));
 return { issues, count, ready:count===5, state:count===5?'ready':issues.some(i=>i.invalid)?'invalid':hasInput?'partial':'empty' };
}
// Fixed demo dates replace Bolto's June 2026 dates, preserving the original 14-day gap.
export const DEMO_DATES = { expires: '2027-06-01', startDate: '2027-06-15' } as const;
export function sampleDraft(): Draft {
 return { template:{classification:'W-2',kind:'Standard'},candidate:{name:'Alex Rivera',email:'alex.rivera@example.com',role:'Senior full-stack engineer',manager:'Jordan Lee',location:'Remote'},compensation:{...emptyCompensation,payType:'full-time',salary:'150000',startDate:DEMO_DATES.startDate,bonusIncluded:true,bonus:'10000',bonusTiming:'first',conditions:'Repaid if the employee leaves within 12 months',equityIncluded:true,equityType:'rsu',units:'1000',rsuSharePrice:'25',vesting:'back'},hire:{payroll:'US Salaried',flsa:'Exempt',i9:'Yes',autoInvite:'Enabled'},terms:{expires:DEMO_DATES.expires,sender:'Sam Patel',senderTitle:'Head of People'},review:{note:'',sent:false} };
}
/** Only an absent saved record is a first-time visit. Empty saved drafts are intentional. */
export function initialDraft(raw: string | null): Draft {
 return restoreDraft(raw) ?? (raw === null ? sampleDraft() : emptyDraft());
}
