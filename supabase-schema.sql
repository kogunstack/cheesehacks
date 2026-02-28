-- Run this in your Supabase Dashboard > SQL Editor
-- This creates all tables needed for per-user communities and friend requests

-- 1. Profiles table (for user discovery)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_emoji text default '🧑',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Communities table (per-user, private)
create table public.communities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table public.communities enable row level security;

create policy "Users manage own communities"
  on public.communities for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Community goals table
create table public.community_goals (
  id uuid default gen_random_uuid() primary key,
  community_id uuid references public.communities(id) on delete cascade not null,
  text text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.community_goals enable row level security;

create policy "Users manage goals in own communities"
  on public.community_goals for all
  to authenticated
  using (
    exists (
      select 1 from public.communities
      where communities.id = community_goals.community_id
      and communities.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.communities
      where communities.id = community_goals.community_id
      and communities.user_id = auth.uid()
    )
  );

-- 5. Friend requests table
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "Users see own friend requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send friend requests"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "Users can respond to received requests"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = to_user_id);

create policy "Users can delete own requests"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- 6. Backfill profiles for existing users
insert into public.profiles (id, email, display_name)
select id, email, split_part(email, '@', 1)
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;
