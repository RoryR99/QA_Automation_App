create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  display_name text not null,
  user_principal_name text not null,
  role text not null default 'Quality Technician',
  site text not null default 'SM Jaleel'
);

create table if not exists public.production_runs (
  id text primary key,
  productioncode text not null,
  brand text not null,
  flavour text not null,
  package_type text not null,
  line text not null,
  shift text not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hourly_inspections (
  id text primary key,
  production_run_id text not null references public.production_runs(id) on delete cascade,
  inspection_type text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inspection_extensions (
  id text primary key,
  related_inspection_id text references public.hourly_inspections(id) on delete set null,
  production_run_id text references public.production_runs(id) on delete cascade,
  payload_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.closure_measurements (
  id text primary key,
  hourly_inspection_id text not null references public.hourly_inspections(id) on delete cascade,
  payload_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.beverage_quality_measurements (
  id text primary key,
  brand text not null,
  flavor text not null,
  packsize text not null,
  frequency text not null,
  fillheightll numeric,
  fillheightul numeric,
  brixll numeric,
  brixul numeric,
  co2ll numeric,
  co2ul numeric,
  phll numeric,
  phul numeric,
  tall numeric,
  taul numeric,
  vitamincll numeric,
  vitamincul numeric
);

create table if not exists public.product_specs (
  id text primary key,
  brand text not null,
  flavour text not null,
  package_type text not null,
  target_temperature_f numeric not null,
  fill_volume_ml numeric not null,
  closure_torque_nm text not null,
  carbonation_range text not null,
  label_sku text not null,
  allergen_note text not null
);

create index if not exists idx_hourly_inspections_production_run_id
  on public.hourly_inspections (production_run_id, created_at desc);

create index if not exists idx_closure_measurements_hourly_inspection_id
  on public.closure_measurements (hourly_inspection_id, created_at desc);

create index if not exists idx_inspection_extensions_related_inspection_id
  on public.inspection_extensions (related_inspection_id, created_at desc);

create index if not exists idx_inspection_extensions_production_run_id
  on public.inspection_extensions (production_run_id, created_at desc);

create index if not exists idx_beverage_quality_measurements_lookup
  on public.beverage_quality_measurements (brand, flavor, packsize);

create index if not exists idx_product_specs_lookup
  on public.product_specs (brand, flavour, package_type);
