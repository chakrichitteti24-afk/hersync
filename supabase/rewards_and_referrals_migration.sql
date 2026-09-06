-- ============================================================
-- SVANEXA AI — COMPLETE REWARDS, REFERRAL & REDEMPTION SCHEMA
-- Run this in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. ADD REFERRAL CODE TO PROFILES
alter table public.profiles
  add column if not exists referral_code text unique;

create index if not exists idx_profiles_referral_code
  on public.profiles(referral_code);


-- 2. FUNCTION TO GENERATE UNIQUE REFERRAL CODE (SVX-XXXXXX)
create or replace function public.generate_unique_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := 'SVX-';
  i integer;
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'SVX-';
    for i in 1..6 loop
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;

    select exists (
      select 1 from public.profiles where referral_code = candidate
    ) into exists_already;

    if not exists_already then
      return candidate;
    end if;
  end loop;
end;
$$;


-- 3. AUTO-ASSIGN REFERRAL CODE TRIGGER FOR NEW PROFILES
create or replace function public.set_profile_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    new.referral_code := public.generate_unique_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_profile_referral_code on public.profiles;
create trigger trg_set_profile_referral_code
  before insert on public.profiles
  for each row
  execute function public.set_profile_referral_code();

-- Backfill any existing profiles missing a referral_code
do $$
declare
  r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles
    set referral_code = public.generate_unique_referral_code()
    where id = r.id;
  end loop;
end;
$$;


-- 4. REFERRALS TABLE (Unique referred_user_id prevents duplicate referrals per user)
create table if not exists public.referrals (
  id                uuid default gen_random_uuid() primary key,
  referrer_id       uuid references auth.users(id) on delete cascade not null,
  referred_user_id  uuid references auth.users(id) on delete cascade not null unique,
  referral_code     text not null,
  status            text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'REJECTED')),
  reward_amount     integer not null default 500,
  created_at        timestamptz default now() not null,
  completed_at      timestamptz,

  -- Self-referral prevention at database constraint level
  check (referrer_id != referred_user_id)
);

alter table public.referrals enable row level security;

drop policy if exists "Referrers can view their outgoing referrals" on public.referrals;
create policy "Referrers can view their outgoing referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

drop policy if exists "Referred users can view their incoming referral" on public.referrals;
create policy "Referred users can view their incoming referral"
  on public.referrals for select
  using (auth.uid() = referred_user_id);

create index if not exists idx_referrals_referrer
  on public.referrals(referrer_id, created_at desc);

create index if not exists idx_referrals_referred
  on public.referrals(referred_user_id);


-- 5. REDEMPTIONS TABLE (Real Money Payout Separation)
create table if not exists public.redemptions (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  coins_redeemed    integer not null check (coins_redeemed >= 10000),
  inr_amount        integer not null check (inr_amount >= 100),
  status            text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  payout_provider   text default 'manual',
  payout_reference  text,
  payout_notes      text,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table public.redemptions enable row level security;

drop policy if exists "Users can view own redemptions" on public.redemptions;
create policy "Users can view own redemptions"
  on public.redemptions for select
  using (auth.uid() = user_id);

create index if not exists idx_redemptions_user_created
  on public.redemptions(user_id, created_at desc);


-- 6. RPC: ATOMIC REDEMPTION (Validates balance >= 10000, deducts coins, inserts ledger, creates redemption)
create or replace function public.redeem_coins_for_inr(
  p_user_id uuid,
  p_coins integer default 10000,
  p_inr integer default 100
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_balance integer := 0;
  v_new_balance integer := 0;
  v_redemption_id uuid;
  v_ref_id text;
begin
  -- Validate inputs
  if p_coins < 10000 then
    return jsonb_build_object(
      'success', false,
      'error', 'Minimum 10,000 coins required for redemption.'
    );
  end if;

  -- Lock row and check balance
  select balance into v_current_balance
  from public.user_coin_balances
  where user_id = p_user_id
  for update;

  if v_current_balance is null or v_current_balance < p_coins then
    return jsonb_build_object(
      'success', false,
      'error', 'Insufficient coins. You need at least 10,000 Coins to redeem ₹100.',
      'current_balance', coalesce(v_current_balance, 0)
    );
  end if;

  -- Create redemption record
  insert into public.redemptions (user_id, coins_redeemed, inr_amount, status)
  values (p_user_id, p_coins, p_inr, 'PENDING')
  returning id into v_redemption_id;

  -- Deduct balance
  update public.user_coin_balances
  set balance = balance - p_coins,
      updated_at = now()
  where user_id = p_user_id;

  select balance into v_new_balance
  from public.user_coin_balances
  where user_id = p_user_id;

  -- Insert ledger transaction
  v_ref_id := 'redemption:' || v_redemption_id::text;
  insert into public.user_coin_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    description
  ) values (
    p_user_id,
    -p_coins,
    'REDEMPTION',
    v_ref_id,
    'Redeemed ' || p_coins || ' coins for ₹' || p_inr || ' cash reward'
  )
  on conflict (user_id, reference_id) do nothing;

  return jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'deducted_coins', p_coins,
    'inr_amount', p_inr,
    'new_balance', v_new_balance,
    'status', 'PENDING'
  );
end;
$$;


-- 7. RPC: COMPLETE REFERRAL REWARD (Atomically awards 500 coins to referrer upon verified account)
create or replace function public.complete_referral_reward(
  p_referral_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ref record;
  v_new_balance integer := 0;
  v_ref_id text;
  v_inserted boolean := false;
begin
  select * into v_ref
  from public.referrals
  where id = p_referral_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Referral not found.');
  end if;

  if v_ref.status = 'COMPLETED' then
    select balance into v_new_balance from public.user_coin_balances where user_id = v_ref.referrer_id;
    return jsonb_build_object(
      'success', true,
      'already_completed', true,
      'new_balance', coalesce(v_new_balance, 0)
    );
  end if;

  -- Self-referral guard
  if v_ref.referrer_id = v_ref.referred_user_id then
    update public.referrals set status = 'REJECTED' where id = p_referral_id;
    return jsonb_build_object('success', false, 'error', 'Self-referrals are not permitted.');
  end if;

  -- Update status to COMPLETED
  update public.referrals
  set status = 'COMPLETED',
      completed_at = now()
  where id = p_referral_id;

  -- Insert ledger entry for Referrer (+500 coins)
  v_ref_id := 'referral:' || p_referral_id::text;
  insert into public.user_coin_transactions (
    user_id,
    amount,
    transaction_type,
    reference_id,
    description
  ) values (
    v_ref.referrer_id,
    v_ref.reward_amount,
    'REFERRAL_REWARD',
    v_ref_id,
    'Referral reward: Friend joined and verified account'
  )
  on conflict (user_id, reference_id) do nothing;

  if found then
    v_inserted := true;
    -- Upsert balance
    insert into public.user_coin_balances (user_id, balance, updated_at)
    values (v_ref.referrer_id, v_ref.reward_amount, now())
    on conflict (user_id) do update
    set balance = public.user_coin_balances.balance + v_ref.reward_amount,
        updated_at = now();
  end if;

  select balance into v_new_balance
  from public.user_coin_balances
  where user_id = v_ref.referrer_id;

  return jsonb_build_object(
    'success', true,
    'awarded', v_inserted,
    'reward_amount', v_ref.reward_amount,
    'new_balance', coalesce(v_new_balance, 0)
  );
end;
$$;
