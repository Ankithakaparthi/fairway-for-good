-- ============================================================
-- DEMO SEED — Run AFTER supabase-schema.sql
-- Creates test users, subscriptions, scores, and a draw
-- so evaluators can test the platform immediately
-- ============================================================

-- NOTE: Supabase Auth users must be created via the dashboard or
-- Auth API. After creating the two users below in the Auth section,
-- paste their UUIDs into the UPDATE statements at the bottom.

-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add User
--   User 1: user@demo.com     / password: Demo1234!
--   User 2: admin@demo.com    / password: Demo1234!

-- Step 2: Copy their UUIDs and replace 'USER_UUID' and 'ADMIN_UUID' below.

-- Step 3: Run this entire file in the SQL Editor.

DO $$
DECLARE
  user_uuid  UUID := 'USER_UUID_HERE';   -- replace with actual UUID
  admin_uuid UUID := 'ADMIN_UUID_HERE';  -- replace with actual UUID
  charity1   UUID;
  charity2   UUID;
  sub_id     UUID;
  draw_id    UUID;
BEGIN

  -- ── Set admin flag ──
  UPDATE profiles SET is_admin = TRUE, full_name = 'Admin User'
  WHERE id = admin_uuid;

  UPDATE profiles SET full_name = 'Jamie Golfer', handicap = 14
  WHERE id = user_uuid;

  -- ── Get first two charity IDs ──
  SELECT id INTO charity1 FROM charities WHERE name = 'Cancer Research UK' LIMIT 1;
  SELECT id INTO charity2 FROM charities WHERE name = 'Mental Health Foundation' LIMIT 1;

  -- ── Create subscription for demo user ──
  INSERT INTO subscriptions (
    id, user_id, plan, status, charity_id, charity_percentage,
    amount_pence, current_period_start, current_period_end
  ) VALUES (
    gen_random_uuid(), user_uuid, 'monthly', 'active',
    charity1, 15, 1999,
    NOW(), NOW() + INTERVAL '30 days'
  ) RETURNING id INTO sub_id;

  -- ── Add 5 scores for demo user ──
  INSERT INTO scores (user_id, score, played_date, course_name) VALUES
    (user_uuid, 34, CURRENT_DATE - 2,  'Royal Birkdale'),
    (user_uuid, 28, CURRENT_DATE - 9,  'St Andrews Old Course'),
    (user_uuid, 31, CURRENT_DATE - 16, 'Muirfield'),
    (user_uuid, 22, CURRENT_DATE - 23, 'Turnberry'),
    (user_uuid, 36, CURRENT_DATE - 30, 'Carnoustie');

  -- ── Create a published draw ──
  INSERT INTO draws (
    id, month, year, status, draw_type, drawn_numbers,
    total_pool, jackpot_pool, match4_pool, match3_pool,
    jackpot_rollover, participant_count, published_at
  ) VALUES (
    gen_random_uuid(),
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER,
    'published', 'random',
    ARRAY[22, 28, 31, 34, 36],  -- matches user's scores exactly for demo!
    1840.00, 736.00, 644.00, 460.00, 0, 92,
    NOW()
  ) RETURNING id INTO draw_id;

  -- ── Create draw entry for user (5-match jackpot winner!) ──
  INSERT INTO draw_entries (
    draw_id, user_id, scores_snapshot, match_count, prize_tier, prize_amount
  ) VALUES (
    draw_id, user_uuid,
    ARRAY[22, 28, 31, 34, 36],
    5, 'match5', 736.00
  );

  -- ── Create winner record ──
  INSERT INTO winners (
    draw_id, user_id, prize_tier, prize_amount,
    verification_status, payment_status
  ) VALUES (
    draw_id, user_uuid, 'match5', 736.00,
    'pending', 'pending'
  );

  -- ── Create charity contribution record ──
  INSERT INTO charity_contributions (
    user_id, charity_id, subscription_id, amount,
    contribution_type, period_month, period_year
  ) VALUES (
    user_uuid, charity1, sub_id, 2.99,
    'subscription',
    EXTRACT(MONTH FROM NOW())::INTEGER,
    EXTRACT(YEAR FROM NOW())::INTEGER
  );

  -- ── Update charity total raised ──
  UPDATE charities SET total_raised = total_raised + 2.99 WHERE id = charity1;

  RAISE NOTICE 'Demo seed complete!';
  RAISE NOTICE 'Demo user:  user@demo.com  / Demo1234!';
  RAISE NOTICE 'Demo admin: admin@demo.com / Demo1234!';
  RAISE NOTICE 'The demo user has a 5-match jackpot win waiting for admin verification.';

END $$;
