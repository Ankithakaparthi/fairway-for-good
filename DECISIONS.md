# DECISIONS.md — Ambiguous Requirements & Design Choices

This document records every requirement that was ambiguous, missing detail, or open to interpretation in the PRD — and explains the decision made and why.

---

## 1. Score Entry — Minimum Score Count for Draw Eligibility

**Ambiguity:** The PRD says users must enter their "last 5 golf scores" but does not specify whether a user needs all 5 before they can enter a draw, or whether partial sets are valid.

**Decision:** Users with at least 1 score are entered into draws. Their available scores (up to 5) are used as their draw numbers. This is more inclusive, rewards early adopters, and avoids penalising new users who haven't played 5 rounds yet.

**Where implemented:** `draw-engine.ts` → `runDrawSimulation`, `admin/draws/page.tsx`

---

## 2. Draw Engine — Algorithmic Mode Definition

**Ambiguity:** The PRD says "Algorithmic — weighted by most/least frequent user scores" but does not specify which direction: should frequent scores be *more* or *less* likely to be drawn?

**Decision:** Implemented both modes as a togglable option within the algorithmic draw:
- `frequent` mode: numbers appearing most in user scores get higher draw weight (hot numbers)
- `infrequent` mode: rarer numbers get higher weight (cold numbers, harder to win)

Admin selects `random` or `algorithmic` — the `algorithmic` default uses `frequent` weighting as this creates more winners and better engagement.

**Where implemented:** `draw-engine.ts` → `algorithmicDraw(allScores, mode)`

---

## 3. Prize Pool — Revenue Allocation Split

**Ambiguity:** The PRD specifies the prize pool *split* (40/35/25%) but does not specify what percentage of total subscription revenue goes *into* the prize pool vs covering operations and charity.

**Decision:** Prize pool = 50% of net subscription revenue (after charity contributions are deducted). The remaining ~40% covers operations, platform costs, and profit margin. This is a standard lottery/prize platform model.

**Where implemented:** `draw-engine.ts` → `calculatePrizePool`

---

## 4. Jackpot Rollover — Accumulation Across Multiple Months

**Ambiguity:** The PRD says "Jackpot rollover to next month if no 5-match winner" but does not clarify whether the rollover *replaces* or *adds to* the next month's jackpot pool.

**Decision:** The rollover *adds to* the next month's jackpot. This creates a growing jackpot mechanic (like a national lottery) which increases platform excitement and retention. The rollover amount is stored in `draws.jackpot_rollover` and is added on top of the new month's 40% allocation.

**Where implemented:** `draws` table schema, `admin/draws/page.tsx` → `handlePublish`

---

## 5. Charity Contribution — Timing of Transfer

**Ambiguity:** The PRD specifies "minimum 10% of subscription fee" goes to charity but does not specify *when* this is transferred or recorded — at signup, monthly, or annually?

**Decision:** Charity contribution is recorded in `charity_contributions` on every successful Stripe invoice payment (i.e. monthly for monthly plans, annually for yearly plans). This gives an accurate per-period audit trail and allows the charity to see regular, predictable income rather than one lump sum.

**Where implemented:** `api/webhooks/stripe/route.ts` → `invoice.payment_succeeded` handler

---

## 6. Winner Verification — No Proof Uploaded Yet

**Ambiguity:** The PRD says winners must upload "a screenshot of scores from the golf platform" but does not specify what happens if they never upload proof, or set a deadline.

**Decision:**
- Admin can approve *or* reject winners regardless of proof upload status (proof is recommended but not technically enforced by the system)
- Admin notes field allows recording a reason for any decision
- No automated deadline — manual admin discretion

This keeps the system flexible for edge cases (e.g. user has screenshot but can't upload it).

**Where implemented:** `admin/winners/page.tsx`, `winners` table schema

---

## 7. Score Replacement — Which Score Gets Dropped

**Ambiguity:** The PRD says "a new score replaces the oldest stored score automatically" but does not define "oldest" — by play date or by entry date?

**Decision:** Oldest = earliest `played_date`. If two scores share the same play date, the earliest `created_at` is used as a tiebreaker. This is semantically correct — the most *recently played* rounds are most relevant to current form.

**Where implemented:** `supabase-schema.sql` → `enforce_score_limit()` trigger

---

## 8. Multiple Winners in Same Tier — Prize Splitting

**Ambiguity:** The PRD says prizes are "split equally among multiple winners in the same tier" but does not specify rounding behaviour.

**Decision:** Prize amounts are rounded to 2 decimal places (pence precision). Any rounding remainder is negligible and absorbed by the platform. Splitting is calculated as `pool / winner_count`, rounded to 2dp.

**Where implemented:** `draw-engine.ts` → `splitPrize`

---

## 9. Subscription Validation — Frequency of Check

**Ambiguity:** The PRD says "real-time subscription status check on every authenticated request." Checking Stripe on every request would be very slow and expensive.

**Decision:** Subscription status is stored in the local `subscriptions` table and kept in sync via Stripe webhooks (`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`). The local DB value is checked on every request (fast). The Stripe webhooks ensure the local value is always accurate. This achieves the intent of "real-time" without the latency cost of calling Stripe's API per request.

**Where implemented:** `api/webhooks/stripe/route.ts`, middleware checks `subscriptions.status`

---

## 10. Admin Draw Simulation — What "Simulate" Means

**Ambiguity:** The PRD mentions "simulation / pre-analysis mode before official publish" but does not define what data the simulation uses or whether it persists.

**Decision:**
- Simulation uses live subscriber data (actual users + their actual scores)
- Results are shown in the UI but NOT written to the database until "Publish" is clicked
- Admin can run multiple simulations (e.g. compare random vs algorithmic) before committing
- Simulation result is held in React state only — no DB writes

**Where implemented:** `admin/draws/page.tsx` → `handleSimulate` / `handlePublish`

---

## 11. Independent Donations — Not Tied to Gameplay

**Ambiguity:** The PRD mentions "independent donation option (not tied to gameplay)" but gives no further specification.

**Decision:** The `charity_contributions` table has a `contribution_type` column (`'subscription'` or `'donation'`). The architecture supports standalone donations. The UI for this is not fully built in v1 (out of scope for MVP) but the data model is ready. A donate button on the charity profile page would insert a row with `contribution_type = 'donation'`.

**Where implemented:** `charity_contributions` table schema, `types/index.ts`

---

## 12. Deployment Constraints — Environment Variable Security

**Ambiguity:** The PRD requires a new Vercel account but does not specify how to handle secrets safely.

**Decision:**
- All secrets are in Vercel environment variables (never in source code)
- `.env.example` is committed; `.env.local` and `.env` are gitignored
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side (API routes), never exposed to the client
- `NEXT_PUBLIC_` prefix is only used for values safe to expose (Supabase URL, anon key, Stripe publishable key)

**Where implemented:** `.env.example`, `.gitignore`, `lib/supabase/server.ts`

---

*Document prepared as part of the Digital Heroes Full-Stack Trainee Selection Process.*
*All decisions were made to best serve the product's stated goals: subscription engine, score experience, draw engine, charity integration, admin control, outstanding UI/UX.*
