-- Run after the migration in a disposable/test Supabase project.
-- Replace UUIDs with a real owner and store created by bootstrap_owner_store.
begin;

-- Anonymous users must see no business data.
set local role anon;
do $$ begin
  if exists(select 1 from public.products) then
    raise exception 'RLS failure: anonymous role can read products';
  end if;
end $$;

rollback;

-- Authenticated-policy and RPC scenarios are exercised after creating the owner:
-- 1. call bootstrap_owner_store as mehdimarzooghian@gmail.com;
-- 2. verify another authenticated user cannot select that store;
-- 3. verify post_sale rejects quantity above inventory;
-- 4. verify private storage returns no object without an authenticated membership;
