-- =============================================
-- RUNE TRIBE - Supabase Database Schema v2
-- Safe to re-run. Run in: SQL Editor > New Query
-- =============================================

-- User ID sequence for numeric IDs
CREATE SEQUENCE IF NOT EXISTS public.user_id_seq START WITH 1001;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_url text DEFAULT '',
  name_color text DEFAULT '#e02020',
  name_effect text DEFAULT 'none',
  rank text DEFAULT 'INITIATE',
  level integer DEFAULT 1,
  balance integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add new columns (safe if they already exist)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN user_id_num bigint DEFAULT nextval('public.user_id_seq');
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN is_banned boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN is_muted boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN muted_until timestamp with time zone DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin policy: admins can update ANY profile (for ban/mute/grant)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.messages;
CREATE POLICY "Authenticated users can view messages"
  ON public.messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin policy: admins can delete any message
DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. MENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.mentions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id bigint REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mentions" ON public.mentions;
CREATE POLICY "Users can view their own mentions"
  ON public.mentions FOR SELECT TO authenticated
  USING (auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Authenticated users can create mentions" ON public.mentions;
CREATE POLICY "Authenticated users can create mentions"
  ON public.mentions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "Users can mark their own mentions as read" ON public.mentions;
CREATE POLICY "Users can mark their own mentions as read"
  ON public.mentions FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id) WITH CHECK (auth.uid() = to_user_id);

-- 4. FUNCTION: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, user_id_num)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', 'USER_' || LEFT(new.id::text, 8)),
    nextval('public.user_id_seq')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. REALTIME
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mentions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_to_user ON public.mentions(to_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mentions_message ON public.mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_num ON public.profiles(user_id_num);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- 7. SET allcontempt AS ADMIN
-- (Will update once this username registers. Re-run after registration.)
UPDATE public.profiles SET is_admin = true WHERE LOWER(username) = 'allcontempt';
