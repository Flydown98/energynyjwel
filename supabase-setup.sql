-- ============================================================
-- 불을 끄고 별을 켜다 · 관리자 페이지용 Supabase 설정
-- Supabase Dashboard → SQL Editor에서 전체 실행하세요.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.campaign_entries (
  id uuid primary key default gen_random_uuid(),
  participation_code text not null unique,
  participant_type text not null check (participant_type in ('adult', 'guardian')),
  name text not null check (char_length(name) between 2 and 30),
  phone text not null check (phone ~ '^[0-9]{9,11}$'),
  privacy_consent boolean not null default true check (privacy_consent = true),
  stars smallint not null default 5 check (stars = 5),
  campaign text not null default '불을 끄고 별을 켜다',
  client_created_at timestamptz,
  created_at timestamptz not null default now(),
  instagram_status text not null default 'unchecked' check (instagram_status in ('unchecked', 'verified', 'invalid')),
  prize_status text not null default 'none' check (prize_status in ('none', 'winner', 'contacted', 'sent')),
  admin_note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.campaign_entries enable row level security;
alter table public.campaign_admins enable row level security;

-- 기존 자동 권한을 회수하고 필요한 권한만 다시 부여합니다.
revoke all on table public.campaign_entries from anon, authenticated;
revoke all on table public.campaign_admins from anon, authenticated;

grant insert (participation_code, participant_type, name, phone, privacy_consent, stars, campaign, client_created_at)
  on public.campaign_entries to anon, authenticated;
grant select, update, delete on public.campaign_entries to authenticated;

-- 로그인한 사용자가 캠페인 관리자 목록에 있는지 확인합니다.
create or replace function public.is_campaign_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.campaign_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_campaign_admin() from public;
grant execute on function public.is_campaign_admin() to authenticated;

-- 정책을 다시 만들 수 있도록 기존 정책이 있으면 제거합니다.
drop policy if exists "campaign public insert" on public.campaign_entries;
drop policy if exists "campaign admin select" on public.campaign_entries;
drop policy if exists "campaign admin update" on public.campaign_entries;
drop policy if exists "campaign admin delete" on public.campaign_entries;

-- 참여자는 INSERT만 가능하고, 다른 참여자의 이름/전화번호를 읽을 수 없습니다.
create policy "campaign public insert"
on public.campaign_entries
for insert
to anon, authenticated
with check (
  privacy_consent = true
  and stars = 5
  and participant_type in ('adult', 'guardian')
  and participation_code ~ '^STAR-[A-Z2-9]{6}$'
  and phone ~ '^[0-9]{9,11}$'
  and char_length(name) between 2 and 30
);

-- 조회/수정/삭제는 campaign_admins에 등록된 관리자만 가능합니다.
create policy "campaign admin select"
on public.campaign_entries
for select
to authenticated
using ((select public.is_campaign_admin()));

create policy "campaign admin update"
on public.campaign_entries
for update
to authenticated
using ((select public.is_campaign_admin()))
with check ((select public.is_campaign_admin()));

create policy "campaign admin delete"
on public.campaign_entries
for delete
to authenticated
using ((select public.is_campaign_admin()));

-- updated_at 자동 갱신
create or replace function public.set_campaign_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_campaign_entries_updated_at on public.campaign_entries;
create trigger trg_campaign_entries_updated_at
before update on public.campaign_entries
for each row execute function public.set_campaign_updated_at();

-- ============================================================
-- [중요] 위 SQL을 실행한 뒤:
-- 1) Authentication → Users에서 관리자 계정을 1개 직접 만듭니다.
-- 2) 아래 YOUR_ADMIN_EMAIL을 실제 관리자 이메일로 바꾸고 이 문장만 실행합니다.
-- ============================================================
-- insert into public.campaign_admins (user_id)
-- select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
-- on conflict (user_id) do nothing;
