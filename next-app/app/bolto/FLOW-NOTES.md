# Bolto flow integration

All offer state lives in the Bolto layout's `DraftProvider`. Candidate employment type, start date, and contract end date use the existing compensation model directly; there are no duplicate candidate date/pay-type fields. Review is a derived projection, not an independent draft. Routes: `/bolto/template`, `/bolto/candidate`, `/bolto/compensation`, `/bolto/hire-setup`, `/bolto/offer-terms`, and `/bolto` (review).

## Persistence

`bolto:offer-draft:v2` stores a versioned snapshot synchronously on each edit. Numeric terms are numbers or null. Separate unformatted editing lexemes preserve trailing decimals, invalid inputs, and temporarily incomplete values. Disabled bonus/equity values remain stored but are omitted from active validation and letter generation. Unsupported or malformed versions are not overwritten on mount. The old standalone compensation v1 draft is migrated when no shared v2 draft exists; the old hardcoded review sample is not automatically imported. Storage failures retain in-memory state and show a warning. Another tab's valid saved snapshot is restored via the storage event (last edit wins).

Reset and sample loading require confirmation. The default fictional example uses fixed dates of June 1, 2027 (expiration) and June 15, 2027 (start), adjusted from the supplied June 2026 dates solely to keep the demo usable while preserving the 14-day gap. Dates are never recalculated on refresh; after these fixed dates pass the sample will correctly fail validation until explicitly updated. The sample is initialized and saved only when there is no shared or legacy compensation draft. An intentionally reset empty draft is persisted as a valid empty snapshot and never refilled automatically. Save as draft uses the same persistence function as autosave. Simulated send status resets on any subsequent edit.

## Prototype assumptions

- Expiration must be strictly later than today in America/Los_Angeles and strictly before the proposed start date. Contract end must be strictly after start. No entered dates are silently corrected.
- W-2 drafts require explicit FLSA and I-9 choices. The demo treats these fields as inapplicable to 1099 drafts, preserving hidden previous values. This is an illustrative applicability rule, not a legal/payroll/immigration determination. No employment classification is inferred from pay type.
- Payroll groups are illustrative selectable values, not a production payroll integration.
- Weekly hours and future share prices are visualization assumptions. Invalid assumptions show compensation-form feedback and suppress misleading chart estimates, but do not block an otherwise valid legal offer. Missing optional estimates never become fictional zero values.
- Existing chart assumptions remain: hourly estimates use actual inclusive contract duration / 7 times weekly hours; fixed fees are allocated once over the duration; hypothetical equity follows annual vesting buckets without acceleration or renewal assumptions.
- Letter preview is unavailable until all five sections are valid. Compact view is an excerpt; expanding shows the full generated facts, dates, bonus timing/conditions, vesting, and sender. Internal hire setup and hypothetical valuations never appear in the candidate-facing letter. Personal note is only part of the simulated accompanying email.
- Standard and Concise use illustrative wording. Company-template content and company/legal clauses remain explicitly labeled placeholders. The former fixed letter date is replaced by a prototype/template label rather than implying an issuance date.

Bolto suppresses automatic analytics and session recording before rendering draft data, restoring the previous client configuration on leaving the Bolto layout. There are no send APIs or external draft transmissions. Use fictional data only.

## Verification

TypeScript: `./node_modules/.bin/tsc --noEmit --incremental false`

Scoped lint: `./node_modules/.bin/eslint app/bolto`

Utilities: `node --import tsx --test app/bolto/draft.test.ts app/bolto/compensation/model.test.ts app/bolto/compensation/currency.test.ts`

Browser checks cover empty-to-ready entry, conditional fields, refresh restoration, live option estimates, edit/navigation, expired and contradictory dates, contract dates, RSUs/options, hourly/fixed fees, unavailable/expanded letters, note separation, required-field removal, simulated sending, reset/sample confirmation, and 390px responsive layouts.

The demo includes an illustrative 1,000-RSU back-loaded four-year grant (10% / 20% / 30% / 40%) and a $25 assumed future share price, yielding a hypothetical $25,000 total, distributed as $2,500 / $5,000 / $7,500 / $10,000 across the four years. The RSU grant is a term; the price/value is a visualization assumption only and is excluded from the letter. First-paycheck bonus timing is the explicit fictional value supplied to complete the original employee example. All six wizard breadcrumbs use one configuration and one component; narrow viewports scroll horizontally.
