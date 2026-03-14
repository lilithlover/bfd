-- =============================================
-- RUNE TRIBE - Supabase Database Schema
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- Run this in: Dashboard > SQL Editor > New Query
-- =============================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text default '',
  name_color text default '#e02020',
  name_effect text default 'none',
  rank text default 'INITIATE',
  level integer default 1,
  balance integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- 2. MESSAGES TABLE
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

drop policy if exists "Authenticated users can view messages" on public.messages;
create policy "Authenticated users can view messages"
  on public.messages for select to authenticated using (true);

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = user_id);

-- 3. MENTIONS TABLE
create table if not exists public.mentions (
  id bigint generated always as identity primary key,
  message_id bigint references public.messages(id) on delete cascade not null,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mentions enable row level security;

drop policy if exists "Users can view their own mentions" on public.mentions;
create policy "Users can view their own mentions"
  on public.mentions for select to authenticated
  using (auth.uid() = to_user_id);

drop policy if exists "Authenticated users can create mentions" on public.mentions;
create policy "Authenticated users can create mentions"
  on public.mentions for insert to authenticated
  with check (auth.uid() = from_user_id);

drop policy if exists "Users can mark their own mentions as read" on public.mentions;
create policy "Users can mark their own mentions as read"
  on public.mentions for update to authenticated
  using (auth.uid() = to_user_id) with check (auth.uid() = to_user_id);

-- 4. FUNCTION: Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'UNKNOWN')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. REALTIME
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.mentions;
exception when duplicate_object then null;
end $$;

-- 6. INDEXES
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_messages_user_id on public.messages(user_id);
create index if not exists idx_mentions_to_user on public.mentions(to_user_id, is_read);
create index if not exists idx_mentions_message on public.mentions(message_id);
