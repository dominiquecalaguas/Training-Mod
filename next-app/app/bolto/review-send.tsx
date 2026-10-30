"use client";

import { useState } from "react";
import { SendCelebration } from "./send-celebration";
import { OfferBreadcrumb } from "./breadcrumb";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useOfferDraft } from "./draft-provider";
import { offerStatus, sections, type Section } from "./draft";
import { reviewOffer } from "./offer";
import flow from "./flow.module.css";
import { CompAsset } from "./compensation/controls";
import { Textarea } from "@/components/ui/textarea";
import {
  Asset, BoltoButton, BoltoDialog, DetailRow, Divider,
  LetterDocument, SuccessCallout, SummaryCard,
} from "./components";
import { dateLabel, money } from "./offer";
import styles from "./review.module.css";


export function ReviewSend() {
  const {draft,update,save,simulate} = useOfferDraft();
  const offer = reviewOffer(draft);
  const status = offerStatus(draft);
  const router = useRouter();
  const edit = (section:Section) => router.push(sections[section].href);
  const note = draft.review.note;
  const simulated = draft.review.sent;
  const c = draft.compensation;
  const complete = (section:Section) => !status.issues.some(i=>i.section===section);
  const missing = (value:string, label='Not yet entered') => value || <span className={flow.warning}>{label}</span>;
  const [letterOpen, setLetterOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  const [feedback, setFeedback] = useState("");

  function saveDraft() { setFeedback(save() ? "Draft saved in this browser." : "Browser storage unavailable. Keep this page open to retain changes."); }
  return <div className={styles.container}>
    <header>
      <Asset name="logo" alt="Bolto" className={styles.logo} />
      <OfferBreadcrumb />
    </header>
    <main>
      <div className={styles.intro}>
        <h1 className={styles.title}>Review &amp; send</h1>
        <p className={styles.subtitle}>Confirm the offer details and review the letter before sending.</p>
      </div>
      <div className={styles.columns}>
        <section className={styles.column} aria-labelledby="offer-details">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} id="offer-details">Offer Details</h2>
            <span className={status.ready ? styles.complete : flow.warning}>{status.count} of 5 complete</span>
          </div>
          <div className={styles.cards}>
            <SummaryCard title={sections.template.title} complete={complete("template")} onEdit={() => edit("template")}>
              <DetailRow label="Letter type">{missing(offer.letterType,"None selected")}</DetailRow>
            </SummaryCard>
            <SummaryCard title={sections.candidate.title} complete={complete("candidate")} onEdit={() => edit("candidate")}>
              {Object.values(draft.candidate).some(Boolean) || c.payType || c.startDate ? <><div className={styles.stack}>
                <p className={styles.name}>{missing(offer.name)}</p>
                <p className={`${styles.text} ${styles.medium}`}>{missing(offer.email)}</p>
              </div>
              <div className={`${styles.stack} ${styles.group}`}>
                <p className={`${styles.text} ${styles.medium}`}>{missing(offer.role)}</p>
                <p className={styles.text}>{missing(offer.employment)}</p>
                <p className={styles.text}>Starts {missing(dateLabel(offer.startDate))} • Reports to {missing(offer.manager)}</p>
              </div>{c.payType === "contract" && <p className={styles.text}>Ends {missing(dateLabel(c.endDate))}</p>}</> : <p className={`${styles.name} ${flow.warning}`}>No candidate &amp; role entered</p>}
            </SummaryCard>
            <SummaryCard title={sections.compensation.title} complete={complete("compensation")} onEdit={() => edit("compensation")}>
              <div className={styles.stack}>
                <p className={`${styles.salary} ${styles.amount}`}>{offer.salary ? money(offer.salary) : <span className={flow.warning}>No base compensation entered</span>}</p>
                <p className={styles.text}>{c.payType === "full-time" ? "Annual base salary" : c.contractType === "hourly" ? "Hourly rate" : c.contractType === "fixed" ? "Fixed project fee" : ""}</p>
              </div>
              <div className={styles.group}>
                <h4 className={styles.cardTitle}>Additional Compensation</h4>
                <Divider />
                <DetailRow label="Signing bonus" className={`${styles.amount} ${styles.money}`}>{c.bonusIncluded ? missing(offer.bonus ? money(offer.bonus) : "") : <span className={flow.warning}>None selected</span>}</DetailRow>
                {c.bonusIncluded && <p className={styles.bonusNote}>{c.conditions || (c.bonusTiming === "first" ? "First paycheck" : c.bonusTiming === "custom" ? `Payment: ${dateLabel(c.bonusDate) || "Not yet entered"}` : "Payment timing not selected")}{c.conditions && <span className={flow.srOnly}> Payment timing: {c.bonusTiming === "first" ? "First paycheck" : dateLabel(c.bonusDate) || "Not selected"}.</span>}</p>}
                {c.equityIncluded ? <>
                <div className={styles.equity}>
                  <p className={`${styles.text} ${styles.medium}`}>Equity</p>
                  <span className={styles.tag}>{c.equityType === "rsu" ? "RSUs" : c.equityType === "options" ? "Stock options" : "Type not selected"}</span>
                  <div className={styles.equityGrid}>
                    <div className={styles.metric}><span>{c.equityType === "rsu" ? "Unit grant" : "Option grant"}</span>
                      <span className={`${styles.money} ${styles.amount}`}>{missing(offer.options ? (Number.isFinite(Number(offer.options)) ? Number(offer.options).toLocaleString("en-US") : offer.options) : "")}</span><span>{c.equityType === "rsu" ? "Restricted stock units" : "Stock options"}</span></div>
                    {c.equityType === "options" && <div className={styles.metric}><span>Exercise price</span>
                      <span className={`${styles.money} ${styles.amount}`}>{missing(offer.exercisePrice ? money(offer.exercisePrice, 2) : "")}</span><span>Per share</span></div>}
                  </div>
                </div>
                <div className={styles.vesting}><DetailRow label="Vesting schedule">{missing(offer.vesting)}</DetailRow></div></> : <DetailRow label="Equity"><span className={flow.warning}>None selected</span></DetailRow>}
              </div>
            </SummaryCard>
            <SummaryCard title={sections.hire.title} complete={complete("hire")} onEdit={() => edit("hire")}>
              <div className={styles.stack}>
                <DetailRow label="Payroll group">{missing(offer.payroll)}</DetailRow>
                <DetailRow label="FLSA">{missing(offer.flsa)}</DetailRow>
                <DetailRow label="I-9 required">{missing(offer.i9)}</DetailRow>
                <DetailRow label="Auto-invite to Bolto">{missing(offer.autoInvite)}</DetailRow>
              </div>
            </SummaryCard>
            <SummaryCard title={sections.terms.title} complete={complete("terms")} onEdit={() => edit("terms")}>
              {draft.terms.expires || draft.terms.sender || draft.terms.senderTitle ? <div className={styles.stack}>
                <DetailRow label="Expires">{missing(dateLabel(offer.expires))}</DetailRow>
                <DetailRow label="From">{missing([offer.sender,offer.senderTitle].filter(Boolean).join(", "))}</DetailRow>
              </div> : <p className={`${styles.name} ${flow.warning}`}>No offer terms &amp; sender entered</p>}
            </SummaryCard>
          </div>
        </section>

        <div className={`${styles.column} ${styles.rightColumn}`}>
          <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
            <section aria-labelledby="offer-letter">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="offer-letter">Offer Letter</h2>
                <DialogTrigger asChild><button type="button" disabled={!status.ready} className={styles.iconButton} aria-label="Expand offer letter"><Asset name="expand" /></button></DialogTrigger>
              </div>
              <div className={styles.documentArea}>
                {status.ready ? <LetterDocument offer={offer} /> : <div className={flow.unavailable}><div className={flow.blur} aria-hidden="true">{Array.from({length:14},(_,i)=><div key={i}/>)}</div><div className={flow.overlay}><p>Letter preview unavailable</p><p>Complete all required fields to generate</p></div></div>}
                <DialogTrigger asChild><button type="button" disabled={!status.ready} className={styles.documentTrigger} aria-label="Open offer letter preview" /></DialogTrigger>
              </div>
              {status.ready && <DialogTrigger asChild><button type="button" className={styles.expandCaption}>Click to expand document</button></DialogTrigger>}
            </section>
            <BoltoDialog title="Offer letter" description="A fictional offer letter for this prototype.">
              <LetterDocument offer={offer} expanded />
            </BoltoDialog>
          </Dialog>
          <section className={styles.card} aria-labelledby="personal-note-title">
            <h3 className={styles.cardTitle} id="personal-note-title"><label htmlFor="personal-note">Personal note (optional)</label></h3>
            <Divider />
            <p className={styles.noteHelp} id="personal-note-help">Included in the offer email, not the letter.</p>
            <Textarea id="personal-note" className={styles.noteInput} value={note} onChange={(event) => update(d=>({...d,review:{...d.review,note:event.target.value}}))}
              placeholder="Add a message to accompany the offer..." aria-describedby="personal-note-help" rows={1} maxLength={2000} />
          </section>
          {status.ready ? <SuccessCallout title={simulated ? "Offer send simulated" : "Ready to send!"}>
            {simulated ? "Your prototype offer is complete. No email or e-signature request was sent." : "All required information is complete. Review the letter and send when you're ready."}
          </SuccessCallout> : <div className={`${styles.callout} ${flow.callout}`} role="status"><CompAsset name="warning"/><div><p className={styles.calloutTitle}>{status.state === "invalid" ? "Offer details need attention" : "Required fields missing"}</p><div className={styles.calloutBody}><p>Complete or correct the following fields before sending:</p><ul>{status.issues.map((issue,i)=><li key={i}>{sections[issue.section].title}: {issue.message}</li>)}</ul></div></div></div>}
        </div>
      </div>
      <footer className={styles.footer}>
        <BoltoButton secondary type="button" onClick={saveDraft}>Save as draft</BoltoButton>
        <p className={styles.feedback} role="status">{feedback}</p>
        <Dialog open={sendOpen || successName !== null} onOpenChange={open=>{if(!open){setSendOpen(false);setSuccessName(null);}}}>
          <DialogTrigger asChild><BoltoButton className={flow.sendButton} type="button" disabled={!status.ready} onClick={event=>{if(offerStatus(draft).ready)setSendOpen(true);else {event.preventDefault();setFeedback("Offer details need attention. Correct the highlighted fields before sending.");}}}>Send for e-signature</BoltoButton></DialogTrigger>
          {successName !== null ? <SendCelebration candidateName={successName} onDismiss={()=>setFeedback("Simulated send completed. No email or e-signature request was sent.")} /> : <BoltoDialog title="Send this offer?" description="This prototype simulates sending. It does not contact the candidate or an e-signature service.">
            <div className={styles.stack}>
              <DetailRow label="To">{offer.name} · {missing(offer.email)}</DetailRow>
              <DetailRow label="From">{offer.sender}</DetailRow>
              {note.trim() && <div><p className={styles.medium}>Personal note</p><p className={styles.text}>{note}</p></div>}
            </div>
            <div className={styles.dialogActions}>
              <DialogClose asChild><BoltoButton secondary>Cancel</BoltoButton></DialogClose>
              <BoltoButton disabled={!status.ready} onClick={() => { if(simulate()) { setSendOpen(false); setSuccessName(draft.candidate.name); setFeedback("Simulated send completed. No email or e-signature request was sent."); } else setFeedback("Correct the offer details before sending."); }}>Simulate send</BoltoButton>
            </div>
          </BoltoDialog>}
        </Dialog>
      </footer>
    </main>
  </div>;
}
