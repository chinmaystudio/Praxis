# Infinity Trials registration: frontend handoff

The route `/events/infinity-trials/register` is a frontend preview. No backend endpoints, email delivery, payment collection, or database writes are implemented. Drafts live only in React memory; refreshing clears them. The preview OTP is visibly `123456`, expires after five minutes, and has a 30-second resend delay. Preview payment and reference IDs are explicitly marked `PREVIEW`.

## Connection points

`lib/infinity-registration.ts` exports the typed `RegistrationGateway` contract. Pass a real gateway to `RegistrationForm` instead of `previewGateway` once services exist. Keep private credentials exclusively on the server. Switch `mode` to `live` only after the integration is complete.

- `requestOtp(email)` returns a challenge ID, expiry and resend timestamp. The server must restrict official PCCOE domains, rate-limit requests and send email. Configure `NEXT_PUBLIC_PCCOE_EMAIL_DOMAINS` with comma-separated organizer-approved domains for matching frontend checks; no domain is guessed by this preview. Server validation is authoritative.
- `verifyOtp(challenge, code)` returns an email-bound verification token. The server must enforce code expiry, attempt limits, single use and email binding. Never trust a client-side verified flag or the preview token.
- `createPayment(draft)` launches the real payment provider and returns a server-confirmed receipt. Verify the amount, currency, order and signed webhook on the server; do not accept a client callback as payment proof.
- `submit({draft, proofs, payment, idempotencyKey})` creates the registration atomically and returns its actual reference, email delivery status and community URL. Revalidate every field, exact team size, unique participant emails and PCCOE PRNs, email proofs and payment status. Use the idempotency key to prevent duplicate registrations on retries. The frontend clears payment state when draft data changes.

## Current fee policy

All four participants at PCCOE: free. Any participant at another college, including mixed teams: ₹200 per team. Confirm the final policy before launch; `teamFee` centralizes the frontend calculation and the server must independently apply the policy. Incomplete college selections show “From free”, not an approved fee. Free teams skip payment entirely. Paid teams cannot finish before a successful payment receipt.

## Records and confirmation

One leader plus exactly three members. The leader has a general contact email and, when PCCOE, an additional verified institutional email. Each PCCOE member uses their own institutional email and PRN; other members have a college name and email without PRN. Academic year and branch are collected for the leader under either college option. The leader’s college name is the team college; mixed affiliations are recorded per participant.

Send the real confirmation email to `draft.leaderEmail` only after successful registration (and verified payment where applicable). Include team name, all four names, colleges, emails, applicable PRNs, leader contact/year/branch, registration reference, entry/payment status, event dates/venue/instructions, and the organizer-provided group/community URL. Return a pending email status if delivery is queued; do not undo or duplicate a paid registration if email delivery needs retrying.

## Frontend checks

Mandatory-field errors and focus, valid email, Indian mobile number, unique participant emails and PCCOE PRNs, PRN visibility by college type, OTP per PCCOE participant, reset proofs after email/college changes, dynamic mixed-team fee, required rules acceptance, review/edit navigation, payment gating, busy/error states and an explicitly labeled preview confirmation are implemented. Add server-side validation and privacy/retention consent appropriate to the final deployment before collecting real registrations.
