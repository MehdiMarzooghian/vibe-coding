-- Mizan supermarket management schema
-- Money is stored as whole tomans (bigint). Quantities and costs use numeric values.

create extension if not exists pgcrypto;

do $$ begin
  create type public.store_role as enum ('owner', 'cashier', 'inventory_clerk');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.document_status as enum ('draft', 'posted', 'voided', 'partially_returned', 'returned');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.partner_type as enum ('supplier', 'customer', 'both');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_method as enum ('cash', 'card', 'mixed', 'credit', 'bank_transfer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.movement_type as enum ('opening', 'purchase', 'sale', 'sale_return', 'purchase_return', 'adjustment');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.return_type as enum ('sale', 'purchase');
exception when duplicate_object then null; end $$;

create table if not exists public.app_settings (
  singleton boolean primary key default true check (singleton),
  owner_email text not null
);
insert into public.app_settings (singleton, owner_email)
values (true, 'mehdimarzooghian@gmail.com')
on conflict (singleton) do update set owner_email = excluded.owner_email;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'TOMAN' check (currency = 'TOMAN'),
  timezone text not null default 'Asia/Tehran',
  tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  expiry_warning_days integer not null default 30 check (expiry_warning_days between 1 and 365),
  receipt_footer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.store_role not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  base_unit text not null default 'عدد',
  sale_price bigint not null default 0 check (sale_price >= 0),
  minimum_stock numeric(18,3) not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku)
);
create unique index if not exists products_store_barcode_unique on public.products(store_id, barcode) where barcode is not null and barcode <> '';

create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  factor numeric(18,6) not null default 1 check (factor > 0),
  barcode text,
  sale_price bigint not null default 0 check (sale_price >= 0),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);
create unique index if not exists product_units_store_barcode_unique on public.product_units(store_id, barcode) where barcode is not null and barcode <> '';
create unique index if not exists product_units_one_default on public.product_units(product_id) where is_default;

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  type public.partner_type not null,
  phone text,
  notes text,
  opening_balance bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid references public.partners(id) on delete set null,
  invoice_number text not null,
  status public.document_status not null default 'draft',
  subtotal bigint not null default 0 check (subtotal >= 0),
  discount bigint not null default 0 check (discount >= 0),
  tax bigint not null default 0 check (tax >= 0),
  total bigint not null default 0 check (total >= 0),
  paid bigint not null default 0 check (paid >= 0),
  returned_total bigint not null default 0 check (returned_total >= 0),
  notes text,
  issued_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, invoice_number)
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  unit_id uuid not null references public.product_units(id),
  product_name text not null,
  sku text not null,
  barcode text,
  unit_name text not null,
  unit_factor numeric(18,6) not null,
  quantity numeric(18,3) not null check (quantity > 0),
  base_quantity numeric(18,3) not null check (base_quantity > 0),
  unit_cost numeric(18,4) not null check (unit_cost >= 0),
  base_unit_cost numeric(18,4) not null check (base_unit_cost >= 0),
  line_total bigint not null check (line_total >= 0),
  expiry_date date,
  returned_base_quantity numeric(18,3) not null default 0 check (returned_base_quantity >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.partners(id) on delete set null,
  invoice_number text not null,
  status public.document_status not null default 'draft',
  subtotal bigint not null default 0 check (subtotal >= 0),
  discount bigint not null default 0 check (discount >= 0),
  tax bigint not null default 0 check (tax >= 0),
  total bigint not null default 0 check (total >= 0),
  paid bigint not null default 0 check (paid >= 0),
  cost_of_goods numeric(20,4) not null default 0 check (cost_of_goods >= 0),
  returned_total bigint not null default 0 check (returned_total >= 0),
  returned_cost numeric(20,4) not null default 0 check (returned_cost >= 0),
  notes text,
  issued_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, invoice_number)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  unit_id uuid not null references public.product_units(id),
  product_name text not null,
  sku text not null,
  barcode text,
  unit_name text not null,
  unit_factor numeric(18,6) not null,
  quantity numeric(18,3) not null check (quantity > 0),
  base_quantity numeric(18,3) not null check (base_quantity > 0),
  unit_price bigint not null check (unit_price >= 0),
  captured_base_cost numeric(18,4) not null check (captured_base_cost >= 0),
  line_total bigint not null check (line_total >= 0),
  line_cost numeric(20,4) not null check (line_cost >= 0),
  returned_base_quantity numeric(18,3) not null default 0 check (returned_base_quantity >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_balances (
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(18,3) not null default 0 check (quantity >= 0),
  average_cost numeric(18,4) not null default 0 check (average_cost >= 0),
  updated_at timestamptz not null default now(),
  primary key (store_id, product_id)
);

create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id),
  purchase_item_id uuid references public.purchase_items(id) on delete set null,
  source_type public.movement_type not null,
  quantity_received numeric(18,3) not null check (quantity_received > 0),
  quantity_remaining numeric(18,3) not null check (quantity_remaining >= 0),
  unit_cost numeric(18,4) not null check (unit_cost >= 0),
  expiry_date date,
  acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id),
  lot_id uuid references public.inventory_lots(id) on delete set null,
  movement_type public.movement_type not null,
  quantity numeric(18,3) not null check (quantity <> 0),
  unit_cost numeric(18,4) not null default 0,
  reference_type text not null,
  reference_id uuid not null,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_item_allocations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete cascade,
  lot_id uuid not null references public.inventory_lots(id),
  quantity numeric(18,3) not null check (quantity > 0),
  returned_quantity numeric(18,3) not null default 0 check (returned_quantity >= 0 and returned_quantity <= quantity),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  direction text not null check (direction in ('incoming', 'outgoing')),
  amount bigint not null check (amount > 0),
  method public.payment_method not null,
  reference_type text not null,
  reference_id uuid not null,
  notes text,
  paid_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  category text not null,
  amount bigint not null check (amount > 0),
  payment_method public.payment_method not null,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type public.return_type not null,
  purchase_id uuid references public.purchases(id),
  sale_id uuid references public.sales(id),
  reason text not null,
  total bigint not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((type = 'sale' and sale_id is not null and purchase_id is null) or (type = 'purchase' and purchase_id is not null and sale_id is null))
);

create table if not exists public.return_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  return_id uuid not null references public.returns(id) on delete cascade,
  product_id uuid not null references public.products(id),
  purchase_item_id uuid references public.purchase_items(id),
  sale_item_id uuid references public.sale_items(id),
  base_quantity numeric(18,3) not null check (base_quantity > 0),
  unit_amount numeric(18,4) not null,
  line_total bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  entity_type text not null check (entity_type in ('purchase', 'sale', 'expense')),
  entity_id uuid not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists purchases_store_date_idx on public.purchases(store_id, issued_at desc);
create index if not exists sales_store_date_idx on public.sales(store_id, issued_at desc);
create index if not exists inventory_lots_fefo_idx on public.inventory_lots(store_id, product_id, expiry_date, acquired_at) where quantity_remaining > 0;
create index if not exists inventory_movements_product_idx on public.inventory_movements(store_id, product_id, created_at desc);
create index if not exists expenses_store_date_idx on public.expenses(store_id, occurred_at desc);
create index if not exists audit_store_date_idx on public.audit_logs(store_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at before update on public.stores for each row execute function public.touch_updated_at();
drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists partners_touch_updated_at on public.partners;
create trigger partners_touch_updated_at before update on public.partners for each row execute function public.touch_updated_at();

create or replace function public.is_store_member(p_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.store_memberships where store_id = p_store_id and user_id = auth.uid() and active);
$$;
create or replace function public.has_store_role(p_store_id uuid, p_roles public.store_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.store_memberships where store_id = p_store_id and user_id = auth.uid() and active and role = any(p_roles));
$$;

revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.has_store_role(uuid, public.store_role[]) from public;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.has_store_role(uuid, public.store_role[]) to authenticated;

create or replace function public.bootstrap_owner_store(p_store_name text default 'سوپرمارکت من')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_email text := lower(coalesce(auth.jwt()->>'email','')); v_store uuid;
begin
  if v_user is null then raise exception 'ورود الزامی است'; end if;
  if not exists(select 1 from public.app_settings where lower(owner_email) = v_email) then raise exception 'این حساب اجازه راه‌اندازی فروشگاه را ندارد'; end if;
  select store_id into v_store from public.store_memberships where user_id = v_user and active limit 1;
  if v_store is not null then return v_store; end if;
  insert into public.profiles(id,email,full_name) values(v_user,v_email,'مالک فروشگاه') on conflict(id) do update set email=excluded.email;
  insert into public.stores(name) values(coalesce(nullif(trim(p_store_name),''),'سوپرمارکت من')) returning id into v_store;
  insert into public.store_memberships(store_id,user_id,role) values(v_store,v_user,'owner');
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id) values(v_store,v_user,'bootstrap','store',v_store);
  return v_store;
end $$;
revoke all on function public.bootstrap_owner_store(text) from public;
grant execute on function public.bootstrap_owner_store(text) to authenticated;

-- Row-level security: every business row is scoped to a store membership.
alter table public.app_settings enable row level security;
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.store_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_units enable row level security;
alter table public.partners enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sale_item_allocations enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_own_select on public.profiles;
create policy profiles_own_select on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists stores_member_select on public.stores;
create policy stores_member_select on public.stores for select to authenticated using (public.is_store_member(id));
drop policy if exists stores_owner_update on public.stores;
create policy stores_owner_update on public.stores for update to authenticated using (public.has_store_role(id,array['owner']::public.store_role[])) with check (public.has_store_role(id,array['owner']::public.store_role[]));
drop policy if exists memberships_member_select on public.store_memberships;
create policy memberships_member_select on public.store_memberships for select to authenticated using (user_id = auth.uid() or public.is_store_member(store_id));

do $$
declare t text;
begin
  foreach t in array array['categories','products','product_units','partners','purchases','purchase_items','sales','sale_items','inventory_balances','inventory_lots','inventory_movements','sale_item_allocations','payments','expenses','returns','return_items','attachments','audit_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_member_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_store_member(store_id))', t || '_member_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_manage', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_store_role(store_id,array[''owner'']::public.store_role[])) with check (public.has_store_role(store_id,array[''owner'']::public.store_role[]))', t || '_owner_manage', t);
  end loop;
end $$;

create or replace function public.protect_final_document()
returns trigger language plpgsql as $$
begin
  if old.status <> 'draft' and coalesce(current_setting('app.trusted_rpc', true),'') <> 'on' then
    raise exception 'سند نهایی قابل ویرایش یا حذف مستقیم نیست؛ از مرجوعی یا ابطال استفاده کنید';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists protect_purchases on public.purchases;
create trigger protect_purchases before update or delete on public.purchases for each row execute function public.protect_final_document();
drop trigger if exists protect_sales on public.sales;
create trigger protect_sales before update or delete on public.sales for each row execute function public.protect_final_document();

create or replace function public.make_document_number(p_prefix text)
returns text language sql volatile as $$
  select p_prefix || '-' || to_char(timezone('Asia/Tehran', now()), 'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
$$;

create or replace function public.create_product_with_opening_stock(p_store_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_product uuid; v_unit uuid; v_category uuid; v_lot uuid;
  v_qty numeric(18,3) := coalesce((p_payload->>'initial_stock')::numeric,0);
  v_cost numeric(18,4) := coalesce((p_payload->>'initial_cost')::numeric,0);
begin
  if not public.has_store_role(p_store_id,array['owner','inventory_clerk']::public.store_role[]) then raise exception 'دسترسی ثبت کالا ندارید'; end if;
  perform set_config('app.trusted_rpc','on',true);
  if nullif(trim(p_payload->>'category'),'') is not null then
    insert into public.categories(store_id,name) values(p_store_id,trim(p_payload->>'category'))
    on conflict(store_id,name) do update set name=excluded.name returning id into v_category;
  end if;
  insert into public.products(store_id,category_id,name,sku,barcode,base_unit,sale_price,minimum_stock)
  values(p_store_id,v_category,trim(p_payload->>'name'),trim(p_payload->>'sku'),nullif(trim(p_payload->>'barcode'),''),coalesce(nullif(trim(p_payload->>'base_unit'),''),'عدد'),coalesce((p_payload->>'sale_price')::bigint,0),coalesce((p_payload->>'minimum_stock')::numeric,0))
  returning id into v_product;
  insert into public.product_units(store_id,product_id,name,factor,barcode,sale_price,is_default)
  values(p_store_id,v_product,coalesce(nullif(trim(p_payload->>'base_unit'),''),'عدد'),1,nullif(trim(p_payload->>'barcode'),''),coalesce((p_payload->>'sale_price')::bigint,0),true)
  returning id into v_unit;
  insert into public.inventory_balances(store_id,product_id,quantity,average_cost) values(p_store_id,v_product,v_qty,case when v_qty > 0 then v_cost else 0 end);
  if v_qty > 0 then
    insert into public.inventory_lots(store_id,product_id,source_type,quantity_received,quantity_remaining,unit_cost,expiry_date)
    values(p_store_id,v_product,'opening',v_qty,v_qty,v_cost,nullif(p_payload->>'expiry_date','')::date) returning id into v_lot;
    insert into public.inventory_movements(store_id,product_id,lot_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
    values(p_store_id,v_product,v_lot,'opening',v_qty,v_cost,'product',v_product,'موجودی اولیه',auth.uid());
  end if;
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details)
  values(p_store_id,auth.uid(),'create','product',v_product,jsonb_build_object('opening_quantity',v_qty,'opening_cost',v_cost));
  return jsonb_build_object('id',v_product,'unit_id',v_unit);
end $$;
revoke all on function public.create_product_with_opening_stock(uuid,jsonb) from public;
grant execute on function public.create_product_with_opening_stock(uuid,jsonb) to authenticated;

create or replace function public.import_products(p_store_id uuid, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare row_data jsonb; imported_count integer := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'ساختار فایل معتبر نیست'; end if;
  for row_data in select * from jsonb_array_elements(p_rows) loop
    perform public.create_product_with_opening_stock(p_store_id,row_data);
    imported_count := imported_count + 1;
  end loop;
  return jsonb_build_object('imported',imported_count);
end $$;
revoke all on function public.import_products(uuid,jsonb) from public;
grant execute on function public.import_products(uuid,jsonb) to authenticated;

create or replace function public.post_purchase(p_store_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_purchase uuid; v_number text; v_partner uuid := nullif(p_payload->>'partyId','')::uuid;
  v_subtotal bigint := 0; v_discount bigint := greatest(0,coalesce((p_payload->>'discount')::bigint,0));
  v_tax bigint := greatest(0,coalesce((p_payload->>'tax')::bigint,0)); v_total bigint; v_paid bigint;
  v_method public.payment_method := coalesce((p_payload->>'paymentMethod')::public.payment_method,'credit');
  item jsonb; v_product public.products%rowtype; v_unit public.product_units%rowtype;
  v_item uuid; v_lot uuid; v_qty numeric(18,3); v_base_qty numeric(18,3); v_unit_cost numeric(18,4); v_base_cost numeric(18,4);
  v_line bigint; v_old_qty numeric(18,3); v_old_avg numeric(18,4); v_new_qty numeric(18,3); v_new_avg numeric(18,4);
begin
  if not public.has_store_role(p_store_id,array['owner','inventory_clerk']::public.store_role[]) then raise exception 'دسترسی ثبت خرید ندارید'; end if;
  if jsonb_array_length(coalesce(p_payload->'items','[]'::jsonb)) = 0 then raise exception 'فاکتور باید حداقل یک قلم داشته باشد'; end if;
  if v_partner is not null and not exists(select 1 from public.partners where id=v_partner and store_id=p_store_id and type in ('supplier','both')) then raise exception 'تأمین‌کننده معتبر نیست'; end if;
  perform set_config('app.trusted_rpc','on',true);
  v_number := public.make_document_number('PU');
  insert into public.purchases(store_id,supplier_id,invoice_number,status,notes,created_by)
  values(p_store_id,v_partner,v_number,'draft',nullif(trim(p_payload->>'notes'),''),auth.uid()) returning id into v_purchase;

  for item in select * from jsonb_array_elements(p_payload->'items') loop
    select * into strict v_product from public.products where id=(item->>'productId')::uuid and store_id=p_store_id and active;
    select * into strict v_unit from public.product_units where id=(item->>'unitId')::uuid and product_id=v_product.id and store_id=p_store_id;
    v_qty := (item->>'quantity')::numeric;
    v_unit_cost := (item->>'unitPrice')::numeric;
    if v_qty <= 0 or v_unit_cost < 0 then raise exception 'مقدار یا قیمت خرید نامعتبر است'; end if;
    v_base_qty := round(v_qty * v_unit.factor,3);
    v_base_cost := round(v_unit_cost / v_unit.factor,4);
    v_line := round(v_qty * v_unit_cost)::bigint;
    insert into public.purchase_items(store_id,purchase_id,product_id,unit_id,product_name,sku,barcode,unit_name,unit_factor,quantity,base_quantity,unit_cost,base_unit_cost,line_total,expiry_date)
    values(p_store_id,v_purchase,v_product.id,v_unit.id,v_product.name,v_product.sku,coalesce(v_unit.barcode,v_product.barcode),v_unit.name,v_unit.factor,v_qty,v_base_qty,v_unit_cost,v_base_cost,v_line,nullif(item->>'expiryDate','')::date)
    returning id into v_item;

    insert into public.inventory_balances(store_id,product_id,quantity,average_cost) values(p_store_id,v_product.id,0,0) on conflict do nothing;
    select quantity,average_cost into v_old_qty,v_old_avg from public.inventory_balances where store_id=p_store_id and product_id=v_product.id for update;
    v_new_qty := v_old_qty + v_base_qty;
    v_new_avg := case when v_new_qty=0 then 0 else round(((v_old_qty*v_old_avg)+(v_base_qty*v_base_cost))/v_new_qty,4) end;
    update public.inventory_balances set quantity=v_new_qty,average_cost=v_new_avg,updated_at=now() where store_id=p_store_id and product_id=v_product.id;
    insert into public.inventory_lots(store_id,product_id,purchase_item_id,source_type,quantity_received,quantity_remaining,unit_cost,expiry_date)
    values(p_store_id,v_product.id,v_item,'purchase',v_base_qty,v_base_qty,v_base_cost,nullif(item->>'expiryDate','')::date) returning id into v_lot;
    insert into public.inventory_movements(store_id,product_id,lot_id,movement_type,quantity,unit_cost,reference_type,reference_id,created_by)
    values(p_store_id,v_product.id,v_lot,'purchase',v_base_qty,v_base_cost,'purchase',v_purchase,auth.uid());
    v_subtotal := v_subtotal + v_line;
  end loop;

  v_total := greatest(0,v_subtotal-v_discount+v_tax);
  v_paid := least(v_total,greatest(0,coalesce((p_payload->>'paidAmount')::bigint,0)));
  update public.purchases set subtotal=v_subtotal,discount=v_discount,tax=v_tax,total=v_total,paid=v_paid,status='posted',updated_at=now() where id=v_purchase;
  if v_paid > 0 then
    insert into public.payments(store_id,partner_id,direction,amount,method,reference_type,reference_id,created_by)
    values(p_store_id,v_partner,'outgoing',v_paid,v_method,'purchase',v_purchase,auth.uid());
  end if;
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details)
  values(p_store_id,auth.uid(),'post','purchase',v_purchase,jsonb_build_object('number',v_number,'total',v_total,'paid',v_paid));
  return jsonb_build_object('id',v_purchase,'invoice_number',v_number,'total',v_total);
exception when no_data_found then raise exception 'کالا یا واحد انتخاب‌شده معتبر نیست';
end $$;
revoke all on function public.post_purchase(uuid,jsonb) from public;
grant execute on function public.post_purchase(uuid,jsonb) to authenticated;

create or replace function public.post_sale(p_store_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sale uuid; v_number text; v_partner uuid := nullif(p_payload->>'partyId','')::uuid;
  v_subtotal bigint := 0; v_cost_total numeric(20,4) := 0;
  v_discount bigint := greatest(0,coalesce((p_payload->>'discount')::bigint,0));
  v_tax bigint := greatest(0,coalesce((p_payload->>'tax')::bigint,0)); v_total bigint; v_paid bigint;
  v_method public.payment_method := coalesce((p_payload->>'paymentMethod')::public.payment_method,'credit');
  item jsonb; v_product public.products%rowtype; v_unit public.product_units%rowtype; lot_row record;
  v_item uuid; v_qty numeric(18,3); v_base_qty numeric(18,3); v_unit_price bigint; v_line bigint;
  v_stock numeric(18,3); v_avg numeric(18,4); v_remaining numeric(18,3); v_take numeric(18,3);
begin
  if not public.has_store_role(p_store_id,array['owner','cashier']::public.store_role[]) then raise exception 'دسترسی ثبت فروش ندارید'; end if;
  if jsonb_array_length(coalesce(p_payload->'items','[]'::jsonb)) = 0 then raise exception 'فاکتور باید حداقل یک قلم داشته باشد'; end if;
  if v_partner is not null and not exists(select 1 from public.partners where id=v_partner and store_id=p_store_id and type in ('customer','both')) then raise exception 'مشتری معتبر نیست'; end if;
  perform set_config('app.trusted_rpc','on',true);
  v_number := public.make_document_number('SA');
  insert into public.sales(store_id,customer_id,invoice_number,status,notes,created_by)
  values(p_store_id,v_partner,v_number,'draft',nullif(trim(p_payload->>'notes'),''),auth.uid()) returning id into v_sale;

  for item in select * from jsonb_array_elements(p_payload->'items') loop
    select * into strict v_product from public.products where id=(item->>'productId')::uuid and store_id=p_store_id and active;
    select * into strict v_unit from public.product_units where id=(item->>'unitId')::uuid and product_id=v_product.id and store_id=p_store_id;
    v_qty := (item->>'quantity')::numeric; v_unit_price := (item->>'unitPrice')::bigint;
    if v_qty <= 0 or v_unit_price < 0 then raise exception 'مقدار یا قیمت فروش نامعتبر است'; end if;
    v_base_qty := round(v_qty*v_unit.factor,3); v_line := round(v_qty*v_unit_price)::bigint;
    select quantity,average_cost into v_stock,v_avg from public.inventory_balances where store_id=p_store_id and product_id=v_product.id for update;
    if not found or v_stock < v_base_qty then raise exception 'موجودی % کافی نیست؛ موجودی فعلی: %',v_product.name,coalesce(v_stock,0); end if;
    insert into public.sale_items(store_id,sale_id,product_id,unit_id,product_name,sku,barcode,unit_name,unit_factor,quantity,base_quantity,unit_price,captured_base_cost,line_total,line_cost)
    values(p_store_id,v_sale,v_product.id,v_unit.id,v_product.name,v_product.sku,coalesce(v_unit.barcode,v_product.barcode),v_unit.name,v_unit.factor,v_qty,v_base_qty,v_unit_price,v_avg,v_line,round(v_base_qty*v_avg,4))
    returning id into v_item;

    v_remaining := v_base_qty;
    for lot_row in select id,quantity_remaining from public.inventory_lots where store_id=p_store_id and product_id=v_product.id and quantity_remaining>0 order by expiry_date asc nulls last,acquired_at asc,id asc for update loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining,lot_row.quantity_remaining);
      update public.inventory_lots set quantity_remaining=quantity_remaining-v_take where id=lot_row.id;
      insert into public.sale_item_allocations(store_id,sale_item_id,lot_id,quantity) values(p_store_id,v_item,lot_row.id,v_take);
      v_remaining := v_remaining-v_take;
    end loop;
    if v_remaining > 0 then raise exception 'بچ انبار برای % با موجودی کل همخوانی ندارد',v_product.name; end if;
    update public.inventory_balances set quantity=quantity-v_base_qty,updated_at=now() where store_id=p_store_id and product_id=v_product.id;
    insert into public.inventory_movements(store_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,created_by)
    values(p_store_id,v_product.id,'sale',-v_base_qty,v_avg,'sale',v_sale,auth.uid());
    v_subtotal := v_subtotal+v_line; v_cost_total := v_cost_total+round(v_base_qty*v_avg,4);
  end loop;

  v_total := greatest(0,v_subtotal-v_discount+v_tax);
  v_paid := least(v_total,greatest(0,coalesce((p_payload->>'paidAmount')::bigint,0)));
  update public.sales set subtotal=v_subtotal,discount=v_discount,tax=v_tax,total=v_total,paid=v_paid,cost_of_goods=v_cost_total,status='posted',updated_at=now() where id=v_sale;
  if v_paid > 0 then
    insert into public.payments(store_id,partner_id,direction,amount,method,reference_type,reference_id,created_by)
    values(p_store_id,v_partner,'incoming',v_paid,v_method,'sale',v_sale,auth.uid());
  end if;
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details)
  values(p_store_id,auth.uid(),'post','sale',v_sale,jsonb_build_object('number',v_number,'total',v_total,'cost',v_cost_total,'paid',v_paid));
  return jsonb_build_object('id',v_sale,'invoice_number',v_number,'total',v_total,'cost_of_goods',v_cost_total);
exception when no_data_found then raise exception 'کالا یا واحد انتخاب‌شده معتبر نیست';
end $$;
revoke all on function public.post_sale(uuid,jsonb) from public;
grant execute on function public.post_sale(uuid,jsonb) to authenticated;

create or replace function public.post_sale_return(p_store_id uuid,p_invoice_number text,p_barcode text,p_quantity numeric,p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_sale public.sales%rowtype; v_item public.sale_items%rowtype; v_return uuid;
  v_base_qty numeric(18,3); v_return_total bigint; v_return_cost numeric(20,4);
  v_stock numeric(18,3); v_avg numeric(18,4); v_new_qty numeric(18,3); v_new_avg numeric(18,4);
  v_remaining numeric(18,3); v_take numeric(18,3); allocation record; v_status public.document_status;
begin
  if not public.has_store_role(p_store_id,array['owner','cashier']::public.store_role[]) then raise exception 'دسترسی ثبت مرجوعی فروش ندارید'; end if;
  if p_quantity <= 0 or nullif(trim(p_reason),'') is null then raise exception 'تعداد و دلیل مرجوعی الزامی است'; end if;
  select * into v_sale from public.sales where store_id=p_store_id and invoice_number=p_invoice_number and status in ('posted','partially_returned') for update;
  if not found then raise exception 'فاکتور فروش پیدا نشد یا قابل مرجوعی نیست'; end if;
  select * into v_item from public.sale_items where sale_id=v_sale.id and (barcode=p_barcode or sku=p_barcode) and returned_base_quantity<base_quantity order by created_at limit 1 for update;
  if not found then raise exception 'کالا در فاکتور فروش پیدا نشد'; end if;
  v_base_qty := round(p_quantity*v_item.unit_factor,3);
  if v_base_qty > v_item.base_quantity-v_item.returned_base_quantity then raise exception 'تعداد مرجوعی بیشتر از مانده قابل برگشت است'; end if;
  v_return_total := round((v_base_qty/v_item.base_quantity) * (v_item.line_total - case when v_sale.subtotal=0 then 0 else v_sale.discount*v_item.line_total::numeric/v_sale.subtotal end + case when v_sale.subtotal=0 then 0 else v_sale.tax*v_item.line_total::numeric/v_sale.subtotal end))::bigint;
  v_return_cost := round(v_base_qty*v_item.captured_base_cost,4);
  perform set_config('app.trusted_rpc','on',true);
  insert into public.returns(store_id,type,sale_id,reason,total,created_by) values(p_store_id,'sale',v_sale.id,trim(p_reason),v_return_total,auth.uid()) returning id into v_return;
  insert into public.return_items(store_id,return_id,product_id,sale_item_id,base_quantity,unit_amount,line_total)
  values(p_store_id,v_return,v_item.product_id,v_item.id,v_base_qty,v_item.unit_price,v_return_total);

  v_remaining := v_base_qty;
  for allocation in select a.id,a.lot_id,a.quantity,a.returned_quantity from public.sale_item_allocations a where a.sale_item_id=v_item.id and a.returned_quantity<a.quantity order by a.created_at,a.id for update loop
    exit when v_remaining<=0;
    v_take := least(v_remaining,allocation.quantity-allocation.returned_quantity);
    update public.inventory_lots set quantity_remaining=quantity_remaining+v_take where id=allocation.lot_id;
    update public.sale_item_allocations set returned_quantity=returned_quantity+v_take where id=allocation.id;
    v_remaining := v_remaining-v_take;
  end loop;
  if v_remaining>0 then raise exception 'ردیابی بچ‌های فاکتور ناقص است'; end if;

  select quantity,average_cost into v_stock,v_avg from public.inventory_balances where store_id=p_store_id and product_id=v_item.product_id for update;
  v_new_qty := v_stock+v_base_qty;
  v_new_avg := case when v_new_qty=0 then 0 else round(((v_stock*v_avg)+v_return_cost)/v_new_qty,4) end;
  update public.inventory_balances set quantity=v_new_qty,average_cost=v_new_avg,updated_at=now() where store_id=p_store_id and product_id=v_item.product_id;
  update public.sale_items set returned_base_quantity=returned_base_quantity+v_base_qty where id=v_item.id;
  select case when exists(select 1 from public.sale_items where sale_id=v_sale.id and returned_base_quantity<base_quantity) then 'partially_returned'::public.document_status else 'returned'::public.document_status end into v_status;
  update public.sales set returned_total=returned_total+v_return_total,returned_cost=returned_cost+v_return_cost,paid=greatest(0,paid-v_return_total),status=v_status,updated_at=now() where id=v_sale.id;
  insert into public.inventory_movements(store_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
  values(p_store_id,v_item.product_id,'sale_return',v_base_qty,v_item.captured_base_cost,'return',v_return,trim(p_reason),auth.uid());
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details)
  values(p_store_id,auth.uid(),'return','sale',v_sale.id,jsonb_build_object('return_id',v_return,'quantity',v_base_qty,'amount',v_return_total,'reason',trim(p_reason)));
  return jsonb_build_object('id',v_return,'amount',v_return_total,'status',v_status);
end $$;
revoke all on function public.post_sale_return(uuid,text,text,numeric,text) from public;
grant execute on function public.post_sale_return(uuid,text,text,numeric,text) to authenticated;

create or replace function public.post_purchase_return(p_store_id uuid,p_invoice_number text,p_barcode text,p_quantity numeric,p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_purchase public.purchases%rowtype; v_item public.purchase_items%rowtype; v_return uuid;
  v_base_qty numeric(18,3); v_return_total bigint; v_stock numeric(18,3); v_avg numeric(18,4); v_new_qty numeric(18,3); v_new_avg numeric(18,4);
  v_remaining numeric(18,3); v_take numeric(18,3); lot_row record; v_status public.document_status;
begin
  if not public.has_store_role(p_store_id,array['owner','inventory_clerk']::public.store_role[]) then raise exception 'دسترسی ثبت مرجوعی خرید ندارید'; end if;
  if p_quantity <= 0 or nullif(trim(p_reason),'') is null then raise exception 'تعداد و دلیل مرجوعی الزامی است'; end if;
  select * into v_purchase from public.purchases where store_id=p_store_id and invoice_number=p_invoice_number and status in ('posted','partially_returned') for update;
  if not found then raise exception 'فاکتور خرید پیدا نشد یا قابل مرجوعی نیست'; end if;
  select * into v_item from public.purchase_items where purchase_id=v_purchase.id and (barcode=p_barcode or sku=p_barcode) and returned_base_quantity<base_quantity order by created_at limit 1 for update;
  if not found then raise exception 'کالا در فاکتور خرید پیدا نشد'; end if;
  v_base_qty := round(p_quantity*v_item.unit_factor,3);
  if v_base_qty > v_item.base_quantity-v_item.returned_base_quantity then raise exception 'تعداد مرجوعی بیشتر از مانده قابل برگشت است'; end if;
  if coalesce((select sum(quantity_remaining) from public.inventory_lots where purchase_item_id=v_item.id),0)<v_base_qty then raise exception 'بخشی از این بچ فروخته شده و موجودی کافی برای مرجوعی خرید نیست'; end if;
  v_return_total := round((v_base_qty/v_item.base_quantity) * (v_item.line_total - case when v_purchase.subtotal=0 then 0 else v_purchase.discount*v_item.line_total::numeric/v_purchase.subtotal end + case when v_purchase.subtotal=0 then 0 else v_purchase.tax*v_item.line_total::numeric/v_purchase.subtotal end))::bigint;
  perform set_config('app.trusted_rpc','on',true);
  insert into public.returns(store_id,type,purchase_id,reason,total,created_by) values(p_store_id,'purchase',v_purchase.id,trim(p_reason),v_return_total,auth.uid()) returning id into v_return;
  insert into public.return_items(store_id,return_id,product_id,purchase_item_id,base_quantity,unit_amount,line_total)
  values(p_store_id,v_return,v_item.product_id,v_item.id,v_base_qty,v_item.base_unit_cost,v_return_total);

  v_remaining := v_base_qty;
  for lot_row in select id,quantity_remaining from public.inventory_lots where purchase_item_id=v_item.id and quantity_remaining>0 order by acquired_at,id for update loop
    exit when v_remaining<=0;
    v_take := least(v_remaining,lot_row.quantity_remaining);
    update public.inventory_lots set quantity_remaining=quantity_remaining-v_take where id=lot_row.id;
    v_remaining := v_remaining-v_take;
  end loop;
  select quantity,average_cost into v_stock,v_avg from public.inventory_balances where store_id=p_store_id and product_id=v_item.product_id for update;
  if v_stock<v_base_qty then raise exception 'موجودی کل کالا برای مرجوعی کافی نیست'; end if;
  v_new_qty := v_stock-v_base_qty;
  v_new_avg := case when v_new_qty=0 then 0 else round(greatest(0,(v_stock*v_avg)-(v_base_qty*v_item.base_unit_cost))/v_new_qty,4) end;
  update public.inventory_balances set quantity=v_new_qty,average_cost=v_new_avg,updated_at=now() where store_id=p_store_id and product_id=v_item.product_id;
  update public.purchase_items set returned_base_quantity=returned_base_quantity+v_base_qty where id=v_item.id;
  select case when exists(select 1 from public.purchase_items where purchase_id=v_purchase.id and returned_base_quantity<base_quantity) then 'partially_returned'::public.document_status else 'returned'::public.document_status end into v_status;
  update public.purchases set returned_total=returned_total+v_return_total,paid=greatest(0,paid-v_return_total),status=v_status,updated_at=now() where id=v_purchase.id;
  insert into public.inventory_movements(store_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
  values(p_store_id,v_item.product_id,'purchase_return',-v_base_qty,v_item.base_unit_cost,'return',v_return,trim(p_reason),auth.uid());
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details)
  values(p_store_id,auth.uid(),'return','purchase',v_purchase.id,jsonb_build_object('return_id',v_return,'quantity',v_base_qty,'amount',v_return_total,'reason',trim(p_reason)));
  return jsonb_build_object('id',v_return,'amount',v_return_total,'status',v_status);
end $$;
revoke all on function public.post_purchase_return(uuid,text,text,numeric,text) from public;
grant execute on function public.post_purchase_return(uuid,text,text,numeric,text) to authenticated;

create or replace function public.void_document(p_store_id uuid,p_type text,p_invoice_number text,p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; item_row record;
begin
  if nullif(trim(p_reason),'') is null then raise exception 'دلیل ابطال الزامی است'; end if;
  if p_type='sale' then
    select id into v_id from public.sales where store_id=p_store_id and invoice_number=p_invoice_number and status in ('posted','partially_returned') for update;
    if v_id is null then raise exception 'فاکتور فروش قابل ابطال پیدا نشد'; end if;
    for item_row in select coalesce(barcode,sku) as code,(base_quantity-returned_base_quantity)/unit_factor as quantity from public.sale_items where sale_id=v_id and returned_base_quantity<base_quantity loop
      perform public.post_sale_return(p_store_id,p_invoice_number,item_row.code,item_row.quantity,'ابطال کامل: '||trim(p_reason));
    end loop;
    perform set_config('app.trusted_rpc','on',true);
    update public.sales set status='voided',updated_at=now() where id=v_id;
  elsif p_type='purchase' then
    select id into v_id from public.purchases where store_id=p_store_id and invoice_number=p_invoice_number and status in ('posted','partially_returned') for update;
    if v_id is null then raise exception 'فاکتور خرید قابل ابطال پیدا نشد'; end if;
    for item_row in select coalesce(barcode,sku) as code,(base_quantity-returned_base_quantity)/unit_factor as quantity from public.purchase_items where purchase_id=v_id and returned_base_quantity<base_quantity loop
      perform public.post_purchase_return(p_store_id,p_invoice_number,item_row.code,item_row.quantity,'ابطال کامل: '||trim(p_reason));
    end loop;
    perform set_config('app.trusted_rpc','on',true);
    update public.purchases set status='voided',updated_at=now() where id=v_id;
  else raise exception 'نوع سند معتبر نیست';
  end if;
  insert into public.audit_logs(store_id,actor_id,action,entity_type,entity_id,details) values(p_store_id,auth.uid(),'void',p_type,v_id,jsonb_build_object('reason',trim(p_reason)));
  return jsonb_build_object('id',v_id,'status','voided');
end $$;
revoke all on function public.void_document(uuid,text,text,text) from public;
grant execute on function public.void_document(uuid,text,text,text) to authenticated;

create or replace view public.product_overview with (security_invoker=true) as
select p.id,p.store_id,p.name,p.sku,coalesce(u.barcode,p.barcode) as barcode,coalesce(c.name,'بدون دسته‌بندی') as category_name,p.base_unit,
       coalesce(u.sale_price,p.sale_price) as sale_price,coalesce(b.average_cost,0) as average_cost,coalesce(b.quantity,0) as stock,p.minimum_stock,p.active,
       u.id as default_unit_id,
       (select min(l.expiry_date) from public.inventory_lots l where l.product_id=p.id and l.quantity_remaining>0 and l.expiry_date is not null) as nearest_expiry
from public.products p
left join public.categories c on c.id=p.category_id
left join public.product_units u on u.product_id=p.id and u.is_default
left join public.inventory_balances b on b.product_id=p.id and b.store_id=p.store_id;

create or replace view public.purchase_overview with (security_invoker=true) as
select p.id,p.store_id,p.invoice_number,coalesce(pa.name,'بدون تأمین‌کننده') as party_name,p.issued_at,p.total,p.paid,p.returned_total,p.status,
       count(i.id)::integer as item_count
from public.purchases p left join public.partners pa on pa.id=p.supplier_id left join public.purchase_items i on i.purchase_id=p.id
group by p.id,pa.name;

create or replace view public.sale_overview with (security_invoker=true) as
select s.id,s.store_id,s.invoice_number,coalesce(pa.name,'مشتری نقدی') as party_name,s.issued_at,s.total,s.paid,s.returned_total,s.status,
       count(i.id)::integer as item_count
from public.sales s left join public.partners pa on pa.id=s.customer_id left join public.sale_items i on i.sale_id=s.id
group by s.id,pa.name;

create or replace view public.partner_overview with (security_invoker=true) as
select p.id,p.store_id,p.name,p.type,p.phone,
       p.opening_balance
       + coalesce((select sum(greatest(0,(s.total-s.returned_total)-s.paid)) from public.sales s where s.customer_id=p.id and s.status<>'voided'),0)
       - coalesce((select sum(greatest(0,(b.total-b.returned_total)-b.paid)) from public.purchases b where b.supplier_id=p.id and b.status<>'voided'),0) as balance
from public.partners p where p.active;

create or replace view public.alert_overview with (security_invoker=true) as
select 'stock-'||p.id::text as id,p.store_id,'low_stock'::text as alert_type,p.name as title,
       'موجودی '||trim(to_char(coalesce(b.quantity,0),'FM999999990.999'))||' '||p.base_unit||'؛ حد سفارش '||trim(to_char(p.minimum_stock,'FM999999990.999'))||'.' as description,
       case when coalesce(b.quantity,0)=0 then 'danger' else 'warning' end::text as severity,
       case when coalesce(b.quantity,0)=0 then 1 else 2 end as severity_order
from public.products p left join public.inventory_balances b on b.product_id=p.id and b.store_id=p.store_id
where p.active and coalesce(b.quantity,0)<=p.minimum_stock
union all
select 'expiry-'||l.id::text,l.store_id,'expiry',p.name,
       greatest(0,l.expiry_date-current_date)::text||' روز تا انقضا؛ موجودی بچ '||trim(to_char(l.quantity_remaining,'FM999999990.999'))||' '||p.base_unit||'.',
       case when l.expiry_date<=current_date+7 then 'danger' else 'warning' end,
       case when l.expiry_date<=current_date+7 then 1 else 2 end
from public.inventory_lots l join public.products p on p.id=l.product_id join public.stores s on s.id=l.store_id
where l.quantity_remaining>0 and l.expiry_date is not null and l.expiry_date<=current_date+s.expiry_warning_days
union all
select 'debt-'||p.id::text,p.store_id,'debt',p.name,
       case when p.balance>0 then 'طلب فروشگاه: ' else 'بدهی فروشگاه: ' end||abs(p.balance)::text||' تومان.',
       'info',3
from public.partner_overview p where p.balance<>0;

create or replace function public.dashboard_metrics(p_store_id uuid,p_month_start timestamptz,p_month_end timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_month_sales numeric := 0; v_today_sales numeric := 0; v_month_purchases numeric := 0; v_cost numeric := 0; v_expenses numeric := 0;
  v_inventory numeric := 0; v_receivables numeric := 0; v_payables numeric := 0; v_low integer := 0; v_expiring integer := 0;
  v_trend jsonb := '[]'::jsonb; v_top jsonb := '[]'::jsonb;
begin
  if not public.is_store_member(p_store_id) then raise exception 'دسترسی ندارید'; end if;
  select coalesce(sum(total-returned_total),0),coalesce(sum(cost_of_goods-returned_cost),0)
  into v_month_sales,v_cost from public.sales where store_id=p_store_id and status<>'voided' and issued_at>=p_month_start and issued_at<p_month_end;
  select coalesce(sum(total-returned_total),0) into v_today_sales from public.sales
  where store_id=p_store_id and status<>'voided' and timezone('Asia/Tehran',issued_at)::date=timezone('Asia/Tehran',now())::date;
  select coalesce(sum(total-returned_total),0) into v_month_purchases from public.purchases where store_id=p_store_id and status<>'voided' and issued_at>=p_month_start and issued_at<p_month_end;
  select coalesce(sum(amount),0) into v_expenses from public.expenses where store_id=p_store_id and occurred_at>=p_month_start and occurred_at<p_month_end;
  select coalesce(sum(quantity*average_cost),0) into v_inventory from public.inventory_balances where store_id=p_store_id;
  select coalesce(sum(greatest(balance,0)),0),coalesce(sum(greatest(-balance,0)),0) into v_receivables,v_payables from public.partner_overview where store_id=p_store_id;
  select count(*) into v_low from public.product_overview where store_id=p_store_id and stock<=minimum_stock;
  select count(*) into v_expiring from public.inventory_lots l join public.stores s on s.id=l.store_id where l.store_id=p_store_id and l.quantity_remaining>0 and l.expiry_date is not null and l.expiry_date<=current_date+s.expiry_warning_days;

  select coalesce(jsonb_agg(jsonb_build_object('label',to_char(days.day,'MM/DD'),'sales',coalesce(x.sales,0),'profit',coalesce(x.profit,0)) order by days.day),'[]'::jsonb)
  into v_trend
  from generate_series(timezone('Asia/Tehran',now())::date-6,timezone('Asia/Tehran',now())::date,'1 day') days(day)
  left join lateral (
    select sum(s.total-s.returned_total) as sales,sum((s.total-s.returned_total)-(s.cost_of_goods-s.returned_cost)) as profit
    from public.sales s where s.store_id=p_store_id and s.status<>'voided' and timezone('Asia/Tehran',s.issued_at)::date=days.day
  ) x on true;

  select coalesce(jsonb_agg(jsonb_build_object('name',q.product_name,'quantity',q.quantity,'revenue',q.revenue) order by q.revenue desc),'[]'::jsonb)
  into v_top from (
    select i.product_name,sum(i.base_quantity-i.returned_base_quantity) as quantity,
           sum(case when i.base_quantity=0 then 0 else i.line_total*(i.base_quantity-i.returned_base_quantity)/i.base_quantity end)::bigint as revenue
    from public.sale_items i join public.sales s on s.id=i.sale_id
    where s.store_id=p_store_id and s.status<>'voided' and s.issued_at>=p_month_start and s.issued_at<p_month_end
    group by i.product_name order by revenue desc limit 5
  ) q;

  return jsonb_build_object(
    'today_sales',v_today_sales,'month_sales',v_month_sales,'month_purchases',v_month_purchases,
    'gross_profit',v_month_sales-v_cost,'net_profit',v_month_sales-v_cost-v_expenses,'expenses',v_expenses,
    'inventory_value',v_inventory,'receivables',v_receivables,'payables',v_payables,
    'low_stock_count',v_low,'expiring_count',v_expiring,'sales_trend',v_trend,'top_products',v_top
  );
end $$;
revoke all on function public.dashboard_metrics(uuid,timestamptz,timestamptz) from public;
grant execute on function public.dashboard_metrics(uuid,timestamptz,timestamptz) to authenticated;

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant select on public.product_overview,public.purchase_overview,public.sale_overview,public.partner_overview,public.alert_overview to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('invoice-attachments','invoice-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists invoice_attachments_select on storage.objects;
create policy invoice_attachments_select on storage.objects for select to authenticated using (
  bucket_id='invoice-attachments' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
drop policy if exists invoice_attachments_insert on storage.objects;
create policy invoice_attachments_insert on storage.objects for insert to authenticated with check (
  bucket_id='invoice-attachments' and public.has_store_role(((storage.foldername(name))[1])::uuid,array['owner','inventory_clerk']::public.store_role[])
);
drop policy if exists invoice_attachments_delete on storage.objects;
create policy invoice_attachments_delete on storage.objects for delete to authenticated using (
  bucket_id='invoice-attachments' and public.has_store_role(((storage.foldername(name))[1])::uuid,array['owner']::public.store_role[])
);
