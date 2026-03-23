export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  handicap: number | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  description: string | null
  long_description: string | null
  image_url: string | null
  website_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  upcoming_events: CharityEvent[]
  created_at: string
  updated_at: string
}

export interface CharityEvent {
  title: string
  date: string
  location: string
  description?: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: 'monthly' | 'yearly'
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
  charity_id: string | null
  charity_percentage: number
  amount_pence: number
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  charity?: Charity
}

export interface Score {
  id: string
  user_id: string
  score: number
  played_date: string
  course_name: string | null
  notes: string | null
  created_at: string
}

export interface Draw {
  id: string
  month: number
  year: number
  status: 'pending' | 'simulated' | 'published'
  draw_type: 'random' | 'algorithmic'
  drawn_numbers: number[]
  total_pool: number
  jackpot_pool: number
  match4_pool: number
  match3_pool: number
  jackpot_rollover: number
  participant_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  scores_snapshot: number[]
  match_count: number
  prize_tier: 'match5' | 'match4' | 'match3' | null
  prize_amount: number
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  draw_entry_id: string | null
  prize_tier: 'match5' | 'match4' | 'match3'
  prize_amount: number
  proof_url: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  admin_notes: string | null
  verified_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  draw?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  subscription_id: string | null
  amount: number
  contribution_type: 'subscription' | 'donation'
  period_month: number | null
  period_year: number | null
  created_at: string
  charity?: Charity
}

export type PlanType = 'monthly' | 'yearly'

export const PLAN_PRICES = {
  monthly: { amount: 1999, display: '£19.99', period: 'month' },
  yearly: { amount: 19990, display: '£199.90', period: 'year' },
}

export const PRIZE_POOL_SPLIT = {
  match5: 0.40,
  match4: 0.35,
  match3: 0.25,
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
