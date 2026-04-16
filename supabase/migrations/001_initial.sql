-- ============================================================
-- WC 2026 Hub — Initial Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── Profiles (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  username    TEXT        UNIQUE,
  avatar_url  TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup (reads username/country from auth metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, country)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'country'
  )
  ON CONFLICT (id) DO UPDATE SET
    email    = EXCLUDED.email,
    username = EXCLUDED.username,
    country  = EXCLUDED.country;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Quinielas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quinielas (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  code        TEXT        UNIQUE NOT NULL,
  created_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiniela_members (
  quiniela_id UUID        REFERENCES public.quinielas(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (quiniela_id, user_id)
);

-- ── Matches (populated from API or manually) ─────────────────
CREATE TABLE IF NOT EXISTS public.matches (
  id          TEXT        PRIMARY KEY,  -- API fixture ID or slug
  home_team   TEXT        NOT NULL,
  away_team   TEXT        NOT NULL,
  home_flag   TEXT,
  away_flag   TEXT,
  home_score  INTEGER,
  away_score  INTEGER,
  status      TEXT        DEFAULT 'scheduled',  -- scheduled | live | finished
  starts_at   TIMESTAMPTZ,
  stage       TEXT,       -- "Group A", "Round of 16", "Quarter-Final", etc.
  venue       TEXT
);

-- ── Predictions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.predictions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  quiniela_id   UUID        REFERENCES public.quinielas(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id      TEXT        REFERENCES public.matches(id),
  home_score    INTEGER     NOT NULL,
  away_score    INTEGER     NOT NULL,
  points_earned INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (quiniela_id, user_id, match_id)
);

-- Auto-score predictions when a match finishes
CREATE OR REPLACE FUNCTION public.score_predictions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pred RECORD;
  pts  INTEGER;
  pred_diff INTEGER;
  actual_diff INTEGER;
BEGIN
  -- Only process when match transitions to 'finished'
  IF NEW.status = 'finished' AND OLD.status <> 'finished' THEN
    FOR pred IN
      SELECT * FROM public.predictions WHERE match_id = NEW.id
    LOOP
      actual_diff := NEW.home_score - NEW.away_score;
      pred_diff   := pred.home_score - pred.away_score;

      IF pred.home_score = NEW.home_score AND pred.away_score = NEW.away_score THEN
        pts := 5;
      ELSIF pred_diff = actual_diff THEN
        pts := 3;
      ELSIF SIGN(pred_diff) = SIGN(actual_diff) THEN
        pts := 2;
      ELSE
        pts := 0;
      END IF;

      UPDATE public.predictions
      SET points_earned = pts
      WHERE id = pred.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_match_finish ON public.matches;
CREATE TRIGGER on_match_finish
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.score_predictions();

-- ── Sticker Collection ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_stickers (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  sticker_id  TEXT        NOT NULL,
  quantity    INTEGER     DEFAULT 1,
  is_needed   BOOLEAN     DEFAULT FALSE,
  UNIQUE (user_id, sticker_id)
);

-- ── Trades & Chat ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trade_requests (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user         UUID        REFERENCES public.profiles(id),
  to_user           UUID        REFERENCES public.profiles(id),
  offering_stickers TEXT[]      DEFAULT '{}',
  wanting_stickers  TEXT[]      DEFAULT '{}',
  status            TEXT        DEFAULT 'pending',  -- pending | accepted | rejected | completed
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id    UUID        REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  sender_id   UUID        REFERENCES public.profiles(id),
  content     TEXT        NOT NULL CHECK (char_length(content) <= 1000),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enable Realtime ───────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiniela_members;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quinielas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiniela_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stickers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Matches (public read)
CREATE POLICY "matches_select_all"   ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_admin" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "matches_update_admin" ON public.matches FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Quinielas (members can read, auth can create)
CREATE POLICY "quinielas_select_members" ON public.quinielas FOR SELECT USING (
  id IN (SELECT quiniela_id FROM public.quiniela_members WHERE user_id = auth.uid())
);
CREATE POLICY "quinielas_insert_auth" ON public.quinielas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Quiniela members
CREATE POLICY "qm_select_members" ON public.quiniela_members FOR SELECT USING (
  quiniela_id IN (SELECT quiniela_id FROM public.quiniela_members WHERE user_id = auth.uid())
);
CREATE POLICY "qm_insert_auth" ON public.quiniela_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Predictions (group members can read, own user writes own)
CREATE POLICY "predictions_select_group" ON public.predictions FOR SELECT USING (
  quiniela_id IN (SELECT quiniela_id FROM public.quiniela_members WHERE user_id = auth.uid())
);
CREATE POLICY "predictions_insert_own" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_update_own" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);

-- User stickers
CREATE POLICY "stickers_select_own"  ON public.user_stickers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stickers_insert_own"  ON public.user_stickers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stickers_update_own"  ON public.user_stickers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stickers_delete_own"  ON public.user_stickers FOR DELETE USING (auth.uid() = user_id);

-- Sticker visibility for trade matching (allow reading others' stickers for matching)
CREATE POLICY "stickers_select_others_for_matching" ON public.user_stickers
  FOR SELECT USING (true);  -- Replace with more restrictive policy if needed

-- Trades
CREATE POLICY "trades_select_parties" ON public.trade_requests FOR SELECT USING (
  auth.uid() = from_user OR auth.uid() = to_user
);
CREATE POLICY "trades_insert_auth" ON public.trade_requests FOR INSERT WITH CHECK (auth.uid() = from_user);
CREATE POLICY "trades_update_parties" ON public.trade_requests FOR UPDATE USING (
  auth.uid() = from_user OR auth.uid() = to_user
);

-- Messages
CREATE POLICY "messages_select_parties" ON public.messages FOR SELECT USING (
  trade_id IN (SELECT id FROM public.trade_requests WHERE from_user = auth.uid() OR to_user = auth.uid())
);
CREATE POLICY "messages_insert_parties" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  trade_id IN (SELECT id FROM public.trade_requests WHERE from_user = auth.uid() OR to_user = auth.uid())
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_predictions_quiniela  ON public.predictions (quiniela_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user      ON public.predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match     ON public.predictions (match_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_user    ON public.user_stickers (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_trade        ON public.messages (trade_id);
CREATE INDEX IF NOT EXISTS idx_qm_quiniela           ON public.quiniela_members (quiniela_id);
CREATE INDEX IF NOT EXISTS idx_qm_user               ON public.quiniela_members (user_id);
