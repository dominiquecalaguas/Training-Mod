import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, sampleDraft, offerStatus, validateOffer, serializeDraft, restoreDraft, initialDraft, DEMO_DATES } from './draft';
import { letterFacts, reviewOffer } from './offer';
import { wizardSteps } from './wizard-navigation';
import { annualEquity, equityValue, chartPeriods } from './compensation/model';
const TODAY='2026-10-30';
function valid() { const d=sampleDraft(); d.compensation.equityType='options';d.compensation.options='10000';d.compensation.exercisePrice='5.00';d.compensation.optionsSharePrice='100'; d.compensation.startDate='2027-06-15'; d.terms.expires='2027-06-01'; return d; }
test('empty, partial and ready states derive from actual fields',()=>{assert.equal(offerStatus(emptyDraft(),TODAY).state,'empty');const d=emptyDraft();d.candidate.name='Alex';assert.equal(offerStatus(d,TODAY).state,'partial');assert.equal(offerStatus(d,TODAY).count,0);assert.equal(offerStatus(valid(),TODAY).ready,true);});
test('expiration rejects missing, invalid calendar, past, today and dates at or after start',()=>{for(const date of ['', '2027-02-30','2020-01-01',TODAY,'2027-06-15','2027-06-20']){const d=valid();d.terms.expires=date;assert.equal(offerStatus(d,TODAY).ready,false,date);}});
test('changing start immediately revalidates expiration',()=>{const d=valid();d.compensation.startDate='2027-05-01';assert.ok(validateOffer(d,TODAY).some(i=>i.message==='Offer expiration must be before the start date.'));});
test('contracts require end strictly after start, support hourly and fixed fee once',()=>{const d=valid();d.compensation.payType='contract';for(const end of ['', '2027-02-30','2027-06-10','2027-06-15']){d.compensation.endDate=end;assert.equal(offerStatus(d,TODAY).ready,false);}d.compensation.endDate='2027-12-31';d.compensation.contractType='hourly';d.compensation.hourlyRate='95.50';assert.equal(offerStatus(d,TODAY).ready,true);d.compensation.contractType='fixed';d.compensation.projectFee='15000';assert.equal(offerStatus(d,TODAY).ready,true);assert.equal(Math.round(chartPeriods(d.compensation).reduce((a,p)=>a+(p.base??0),0)),15000);});
test('No is explicit, unanswered hire settings block, classification controls applicability',()=>{const d=valid();d.hire.autoInvite='';assert.equal(offerStatus(d,TODAY).ready,false);d.hire.autoInvite='Disabled';d.hire.i9='No';assert.equal(offerStatus(d,TODAY).ready,true);d.hire.flsa='';assert.equal(offerStatus(d,TODAY).ready,false);d.template.classification='1099';d.hire.i9='';assert.equal(offerStatus(d,TODAY).ready,true);});
test('invalid compensation blocks only active terms',()=>{const d=valid();for(const salary of ['0','-1','bad']){d.compensation.salary=salary;assert.equal(offerStatus(d,TODAY).ready,false);}d.compensation.salary='150000';d.compensation.options='1.2';assert.equal(offerStatus(d,TODAY).ready,false);d.compensation.equityIncluded=false;assert.equal(offerStatus(d,TODAY).ready,true);d.compensation.bonus='-1';assert.equal(offerStatus(d,TODAY).ready,false);d.compensation.bonusIncluded=false;assert.equal(offerStatus(d,TODAY).ready,true);});
test('optional estimates stay out of actual grant terms; options and RSUs render correctly',()=>{const d=valid();d.compensation.optionsSharePrice='-2';assert.equal(offerStatus(d,TODAY).ready,true);assert.match(letterFacts(reviewOffer(d)).join(' '),/10,000 stock options at \$5.00/);d.compensation.equityType='rsu';d.compensation.units='500';assert.equal(offerStatus(d,TODAY).ready,true);assert.match(letterFacts(reviewOffer(d)).join(' '),/500 RSUs/);assert.ok(!letterFacts(reviewOffer(d)).join(' ').includes('per share'));});
test('storage uses raw numbers and restores decimal/invalid lexemes losslessly',()=>{const d=valid();d.compensation.hourlyRate='95.50';d.compensation.bonus='-';d.compensation.bonusIncluded=false;const raw=serializeDraft(d),stored=JSON.parse(raw);assert.equal(stored.data.compensation.salary,150000);assert.equal(stored.data.compensation.hourlyRate,95.5);assert.equal(stored.data.compensation.bonus,null);assert.deepEqual(restoreDraft(raw),d);d.terms.expires='2020-01-01';assert.equal(offerStatus(restoreDraft(serializeDraft(d))!,TODAY).ready,false);});
test('malformed and outdated storage is rejected safely',()=>{for(const raw of ['bad','{}','{"version":1}',serializeDraft(valid()).replace('"salary":150000','"salary":"150,000"')])assert.equal(restoreDraft(raw),null);});
test('removing required fields disables readiness, correction restores it',()=>{const d=valid();for(const key of ['name','email','role','manager','location'] as const){const old=d.candidate[key];d.candidate[key]='';assert.equal(offerStatus(d,TODAY).ready,false);d.candidate[key]=old;assert.equal(offerStatus(d,TODAY).ready,true);}d.candidate.email='bad';assert.equal(offerStatus(d,TODAY).state,'invalid');});

test('first-time sample is ready and uses fixed dates, original employee terms and illustrative RSUs',()=>{
 const d=initialDraft(null);
 assert.equal(offerStatus(d,TODAY).ready,true);
 assert.equal(d.candidate.role,'Senior full-stack engineer');
 assert.equal(d.hire.payroll,'US Salaried');
 assert.equal(d.compensation.equityType,'rsu');
 assert.equal(d.compensation.units,'1000');
 assert.equal(equityValue(d.compensation),25000);
 assert.equal(d.compensation.vesting,'back');
 assert.deepEqual(annualEquity(d.compensation),[2500,5000,7500,10000]);
 assert.deepEqual(chartPeriods(d.compensation).map(p=>p.bonus),[10000,0,0,0]);
 assert.deepEqual(chartPeriods(d.compensation).map(p=>(p.base??0)+(p.bonus??0)+(p.equity??0)),[162500,155000,157500,160000]);
 assert.deepEqual(chartPeriods(d.compensation).map(p=>p.base),[150000,150000,150000,150000]);
 assert.equal(chartPeriods(d.compensation)[0].bonus,10000);
 assert.equal(d.terms.expires,DEMO_DATES.expires);
 assert.equal((Date.parse(d.compensation.startDate)-Date.parse(d.terms.expires))/86400000,14);
 assert.deepEqual(sampleDraft(),sampleDraft());
 const letter=letterFacts(reviewOffer(d)).join(' ');
 assert.match(letter,/1,000 RSUs/);assert.match(letter,/4 years - Back-loaded/);assert.ok(!letter.includes('$25'));assert.ok(!letter.includes('25,000'));assert.ok(!letter.includes('6,250'));
});
test('initialization preserves saved edits, invalid drafts and deliberately empty resets',()=>{
 const d=sampleDraft();d.compensation.vesting='equal';d.compensation.salary='175000';d.terms.expires='2020-01-01';
 assert.deepEqual(initialDraft(serializeDraft(d)),d);
 assert.deepEqual(initialDraft(serializeDraft(emptyDraft())),emptyDraft());
 assert.deepEqual(initialDraft('malformed'),emptyDraft());
 assert.deepEqual(initialDraft(''),emptyDraft());
});
test('shared navigation always contains all six ordered destinations',()=>{
 assert.deepEqual(wizardSteps.map(s=>s.label),['Template','Candidate & Role','Compensation','Hire Setup','Offer Terms & Sender','Review & Send']);
 assert.equal(new Set(wizardSteps.map(s=>s.href)).size,6);
 assert.equal(wizardSteps.at(-1)?.href,'/bolto');
});

test('sample estimates respond to edits without changing salary or bonus',()=>{
 const d=sampleDraft();d.compensation.units='2000';
 assert.deepEqual(annualEquity(d.compensation),[5000,10000,15000,20000]);
 d.compensation.rsuSharePrice='50';
 assert.deepEqual(annualEquity(d.compensation),[10000,20000,30000,40000]);
 d.compensation.vesting='equal';
 assert.deepEqual(annualEquity(d.compensation),[25000,25000,25000,25000]);
 assert.deepEqual(chartPeriods(d.compensation).map(p=>p.base),[150000,150000,150000,150000]);
 assert.deepEqual(chartPeriods(d.compensation).map(p=>p.bonus),[10000,0,0,0]);
});
