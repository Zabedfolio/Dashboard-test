create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  avatar text,
  role text not null default 'user' check (role in ('admin', 'moderator', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own_non_role" on public.profiles;
drop policy if exists "profiles_admin_manage_all" on public.profiles;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.current_profile_role() = 'admin');

create policy "profiles_update_own_non_role"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = public.current_profile_role()
);

create policy "profiles_admin_manage_all"
on public.profiles
for all
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
  assigned_role text;
  super_admin_email text;
begin
  -- Try to get super admin email from app.settings (if available)
  -- Otherwise, check for hardcoded admin email
  super_admin_email := coalesce(
    nullif(current_setting('app.super_admin_email', true), ''),
    'zabedfolio@gmail.com'
  );
  
  -- Check if this email is the super admin email
  if lower(new.email) in ('admin@example.com', lower(super_admin_email)) then
    assigned_role := 'admin';
  else
    -- Check if any admin exists in the system
    select count(*) into admin_count from public.profiles where role = 'admin';
    
    if admin_count = 0 then
      -- No admin exists, make this first user an admin
      assigned_role := 'admin';
    else
      -- Admin exists, assign as regular user
      assigned_role := 'user';
    end if;
  end if;
  
  insert into public.profiles (id, email, role)
  values (new.id, new.email, assigned_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
