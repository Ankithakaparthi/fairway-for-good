-- ============================================================
-- Golf Charity Platform — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  handicap INTEGER,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- CHARITIES
-- ============================================================
CREATE TABLE charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  website_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised DECIMAL(10,2) DEFAULT 0,
  upcoming_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active charities" ON charities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage charities" ON charities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  charity_id UUID REFERENCES charities(id),
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  amount_pence INTEGER NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update subscriptions" ON subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- SCORES
-- ============================================================
CREATE TABLE scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_date DATE NOT NULL,
  course_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scores" ON scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all scores" ON scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Function: enforce max 5 scores per user (rolling)
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
  oldest_score_id UUID;
BEGIN
  SELECT COUNT(*) INTO score_count FROM scores WHERE user_id = NEW.user_id;
  IF score_count >= 5 THEN
    SELECT id INTO oldest_score_id
    FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY played_date ASC, created_at ASC
    LIMIT 1;
    DELETE FROM scores WHERE id = oldest_score_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_score_insert
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE PROCEDURE enforce_score_limit();

-- ============================================================
-- DRAWS
-- ============================================================
CREATE TABLE draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  drawn_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_pool DECIMAL(10,2) DEFAULT 0,
  match4_pool DECIMAL(10,2) DEFAULT 0,
  match3_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_rollover DECIMAL(10,2) DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published draws" ON draws
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage draws" ON draws
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- DRAW ENTRIES
-- ============================================================
CREATE TABLE draw_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scores_snapshot INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  prize_tier TEXT CHECK (prize_tier IN ('match5', 'match4', 'match3')),
  prize_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own draw entries" ON draw_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage draw entries" ON draw_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- WINNERS
-- ============================================================
CREATE TABLE winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  draw_entry_id UUID REFERENCES draw_entries(id),
  prize_tier TEXT NOT NULL CHECK (prize_tier IN ('match5', 'match4', 'match3')),
  prize_amount DECIMAL(10,2) NOT NULL,
  proof_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own winnings" ON winners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload proof" ON winners
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage winners" ON winners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- CHARITY CONTRIBUTIONS
-- ============================================================
CREATE TABLE charity_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  contribution_type TEXT DEFAULT 'subscription' CHECK (contribution_type IN ('subscription', 'donation')),
  period_month INTEGER,
  period_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions" ON charity_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contributions" ON charity_contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================================
-- SEED DATA — Sample Charities
-- ============================================================
INSERT INTO charities (name, description, long_description, category, is_featured, image_url) VALUES
('Cancer Research UK', 'Fighting cancer through research, influence and information', 'Cancer Research UK is the world''s largest independent cancer research charity. We fund scientists, doctors and nurses to help beat cancer sooner.', 'Health', TRUE, 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800'),
('Macmillan Cancer Support', 'Supporting people living with cancer', 'Macmillan Cancer Support improves the lives of people affected by cancer. We provide practical, medical and financial support and push for better cancer care.', 'Health', FALSE, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800'),
('Age UK', 'The UK''s largest charity for older people', 'Age UK provides services and support to people aged 65 and over. We believe everyone should be able to love later life.', 'Social Care', FALSE, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'),
('Mental Health Foundation', 'Prevention and early intervention in mental health', 'The Mental Health Foundation believes that good mental health is fundamental to thriving individuals, communities and societies.', 'Mental Health', TRUE, 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=800'),
('Shelter', 'Fighting bad housing and homelessness', 'Shelter believes that home is a fundamental human need. We fight for the millions of people in Britain who are struggling with bad housing or homelessness.', 'Housing', FALSE, 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_played_date ON scores(played_date DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_charity_contributions_charity_id ON charity_contributions(charity_id);

-- ============================================================
-- RPC: increment_charity_raised
-- Called by the Stripe webhook after each successful payment
-- ============================================================
CREATE OR REPLACE FUNCTION increment_charity_raised(charity_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE charities
  SET total_raised = total_raised + amount,
      updated_at   = NOW()
  WHERE id = charity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: get_platform_stats (used by admin analytics)
-- ============================================================
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users',           (SELECT COUNT(*) FROM profiles),
    'active_subscribers',    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'total_charity_raised',  (SELECT COALESCE(SUM(amount), 0) FROM charity_contributions),
    'total_prize_pool',      (SELECT COALESCE(SUM(total_pool), 0) FROM draws WHERE status = 'published'),
    'pending_winners',       (SELECT COUNT(*) FROM winners WHERE verification_status = 'pending'),
    'draws_published',       (SELECT COUNT(*) FROM draws WHERE status = 'published')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admin panel calls these)
GRANT EXECUTE ON FUNCTION increment_charity_raised TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_stats TO authenticated;

-- ============================================================
-- Storage: winner-proofs bucket policy
-- Run this AFTER creating the bucket in Supabase dashboard
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', true);

-- CREATE POLICY "Winners can upload proof" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'winner-proofs' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Anyone can view proofs" ON storage.objects
--   FOR SELECT USING (bucket_id = 'winner-proofs');
