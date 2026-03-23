# Fairway for Good — Golf Charity Subscription Platform

> Digital Heroes Full-Stack Development Trainee Selection · Submission

A full-stack subscription web application combining Stableford golf score tracking, charity fundraising, and a monthly prize draw engine.

**Live URL:** _Add after Vercel deployment_
**Demo login:** user@demo.com / Demo1234! · admin@demo.com / Demo1234!

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database + Auth | Supabase (PostgreSQL, RLS, Storage) |
| Payments | Stripe (subscriptions, webhooks) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Deployment | Vercel (new account) |

---

## Setup in 5 steps

### 1. Install dependencies
```bash
npm install
```

### 2. Supabase (new project required)
1. Create a **new** project at supabase.com
2. SQL Editor → paste and run `supabase-schema.sql` → Run
3. SQL Editor → paste and run `supabase-seed-demo.sql` (after creating demo users in Auth dashboard)
4. Storage → New bucket → name: `winner-proofs` → Public: on
5. Settings → API → copy Project URL and anon key

### 3. Stripe
1. Dashboard → Products → Create two products:
   - **Monthly**: £19.99/month recurring → copy Price ID
   - **Yearly**: £199.90/year recurring → copy Price ID
2. Developers → API keys → copy Publishable key and Secret key

### 4. Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local` with all keys from steps 2 and 3.

### 5. Run
```bash
npm run dev
# open http://localhost:3000
```

---

## Deployment to Vercel

1. Push to GitHub
2. vercel.com → New Project → **new account** → import repo
3. Environment Variables → add all values from `.env.local`
4. Change `NEXT_PUBLIC_APP_URL` to `https://your-app.vercel.app`
5. Deploy

**After deployment — Stripe webhook:**
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret → add to Vercel env as `STRIPE_WEBHOOK_SECRET`

**Set admin user:**
```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@demo.com';
```

---

## File structure

```
src/
├── middleware.ts                  ← Route protection (auth + admin guard)
├── app/
│   ├── page.tsx                   ← Homepage (charity-led, emotion-driven)
│   ├── error.tsx                  ← Global error boundary
│   ├── not-found.tsx              ← Custom 404
│   ├── auth/login|signup          ← Auth pages (3-step signup)
│   ├── charities/                 ← Public charity directory
│   ├── dashboard/                 ← User panel (5 pages)
│   │   ├── page.tsx               ← Overview
│   │   ├── scores/                ← Score entry (rolling 5)
│   │   ├── charity/               ← Charity selector + % slider
│   │   ├── draws/                 ← Draw history + proof upload
│   │   └── profile/               ← Account management
│   ├── admin/                     ← Admin panel (6 pages)
│   │   ├── page.tsx               ← Overview + quick actions
│   │   ├── users/                 ← User + inline score editing
│   │   ├── draws/                 ← Draw engine (simulate → publish)
│   │   ├── charities/             ← CRUD charity management
│   │   ├── winners/               ← Verification + payout tracking
│   │   └── analytics/             ← Recharts dashboards
│   └── api/
│       ├── checkout/              ← Stripe checkout session
│       └── webhooks/stripe/       ← Full webhook lifecycle
├── components/ui/
│   ├── skeleton.tsx               ← Loading skeletons
│   ├── empty-state.tsx            ← Empty state component
│   └── subscription-guard.tsx     ← Paywall wrapper
├── lib/
│   ├── draw-engine.ts             ← Random + algorithmic draw logic
│   ├── supabase/client|server.ts  ← Supabase clients
│   └── utils.ts                   ← Helpers + formatters
└── types/index.ts                 ← All TypeScript types
```

---

## PRD checklist

| Requirement | Status |
|---|---|
| Subscription engine (monthly + yearly) | ✅ |
| Stripe payment integration | ✅ |
| Score entry — 5-score rolling window | ✅ |
| Score range validation (1–45 Stableford) | ✅ |
| Draw engine — random mode | ✅ |
| Draw engine — algorithmic (frequency-weighted) | ✅ |
| Draw simulation before publish | ✅ |
| Jackpot rollover | ✅ |
| Prize pool split 40/35/25% | ✅ |
| Equal split among multiple tier winners | ✅ |
| Charity selection at signup | ✅ |
| Charity % slider (min 10%) | ✅ |
| Charity contribution tracking | ✅ |
| Winner proof upload | ✅ |
| Admin verify / reject / mark paid | ✅ |
| User dashboard (all 5 modules) | ✅ |
| Admin dashboard (all 5 modules) | ✅ |
| Mobile-first responsive design | ✅ |
| JWT / session auth | ✅ (Supabase Auth) |
| Route protection middleware | ✅ |
| Admin-only route guard | ✅ |
| RLS policies on all tables | ✅ |
| Analytics + reporting | ✅ |
| Charity directory (search + filter) | ✅ |
| Featured charity section | ✅ |
| Error handling + edge cases | ✅ |
| Scalability notes (multi-country, mobile app) | ✅ |

---

## Key design decisions

See `DECISIONS.md` for full reasoning on every ambiguous requirement.

Short version:
- **Score eligibility**: 1+ score required (not 5) — more inclusive
- **Algorithmic draw**: weighted by score frequency, admin-selectable
- **Prize pool**: 50% of net revenue goes to pool
- **Rollover**: adds to next month's jackpot (growing jackpot mechanic)
- **Charity timing**: recorded per Stripe invoice (monthly cadence)
- **Subscription validation**: local DB checked per request, kept in sync via webhooks

---

## Stripe test cards

| Card | Result |
|---|---|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |
| 4000 0025 0000 3155 | 3D Secure required |

Use any future expiry, any CVC, any postcode.

---

Built for Digital Heroes · digitalheroes.co.in
