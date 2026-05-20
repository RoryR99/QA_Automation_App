create extension if not exists pgcrypto;

do $$
begin
  create type public.inspection_type as enum (
    'primary-packaging',
    'secondary-packaging',
    'product-specs'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.acceptability_status as enum (
    'acceptable',
    'non-acceptable'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.completion_status as enum (
    'completed',
    'not-completed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  display_name text not null,
  user_principal_name text not null unique,
  role text not null default 'Quality Technician',
  site text not null default 'SM Jaleel',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Fact/specification table imported from the source quality system.
-- Brand, flavor, and package dropdowns should be derived from this table or the views below.
create table if not exists public.beverage_quality_measurements (
  beveragequalitymeasurementid text primary key,
  brand text not null,
  flavor text not null,
  packagesizeml numeric not null,
  productspecification text,
  fillheightmeasurementfrequency text,
  fillheightlowerlimit numeric,
  fillheightupperlimit numeric,
  brixmeasurementfrequency text,
  brixlowerlimit numeric,
  brixupperlimit numeric,
  co2measurementfrequency text,
  co2lowerlimit numeric,
  co2upperlimit numeric,
  phmeasurementfrequency text,
  phlowerlimit numeric,
  phupperlimit numeric,
  titratableaciditymeasurementfrequ text,
  titratableaciditylowerlimit numeric,
  titratableacidityupperlimit numeric,
  vitamincmeasurementfrequency text,
  vitaminclowerlimit numeric,
  vitamincupperlimit numeric,
  status text,
  statusreason text,
  statuscode integer,
  statecode integer,
  importsequencenumber bigint,
  versionnumber bigint,
  source_payload jsonb not null default '{}'::jsonb,
  recordcreatedon timestamptz,
  createdon timestamptz,
  modifiedon timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint beverage_quality_brand_flavor_package_uniq
    unique (brand, flavor, packagesizeml),
  constraint beverage_quality_package_positive
    check (packagesizeml > 0)
);

create or replace view public.beverage_quality_brands as
select distinct brand
from public.beverage_quality_measurements
where nullif(trim(brand), '') is not null
order by brand;

create or replace view public.beverage_quality_flavors as
select distinct brand, flavor
from public.beverage_quality_measurements
where nullif(trim(brand), '') is not null
  and nullif(trim(flavor), '') is not null
order by brand, flavor;

create or replace view public.beverage_quality_packages as
select
  beveragequalitymeasurementid,
  brand,
  flavor,
  packagesizeml
from public.beverage_quality_measurements
where nullif(trim(brand), '') is not null
  and nullif(trim(flavor), '') is not null
order by brand, flavor, packagesizeml;

create table if not exists public.production_lines (
  id uuid primary key default gen_random_uuid(),
  line_code text not null unique,
  display_name text not null,
  site text not null default 'SM Jaleel',
  is_active boolean not null default true
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  shift_key text not null unique,
  display_name text not null,
  is_active boolean not null default true
);

create table if not exists public.production_runs (
  id uuid primary key default gen_random_uuid(),
  productioncode text not null unique,
  beverage_quality_measurement_id text
    references public.beverage_quality_measurements(beveragequalitymeasurementid),
  brand text not null,
  flavor text not null,
  package_size_ml numeric,
  package_type text not null,
  line_id uuid references public.production_lines(id),
  line text not null,
  shift_id uuid references public.shifts(id),
  shift_key text,
  shift text not null,
  mfg_date date not null,
  best_before_date date,
  production_supervisor text not null,
  qa_shift_supervisor text,
  qa_technician text not null,
  qa_technician_user_id uuid references public.users(id),
  qa_technician_identifier text,
  shrinkwrap_operator text,
  filler_operator text,
  label_operator text,
  epicor_production text,
  epicor_syrup text,
  planner text,
  description text,
  mes_completed boolean not null default false,
  job_transfer_completed boolean not null default false,
  destination_local boolean not null default false,
  destination_export boolean not null default false,
  label_sample_photo_url text,
  code_verification_photo_url text,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint production_runs_spec_snapshot_match
    foreign key (brand, flavor, package_size_ml)
    references public.beverage_quality_measurements(brand, flavor, packagesizeml)
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  production_run_id uuid not null references public.production_runs(id) on delete cascade,
  inspection_type public.inspection_type not null,
  inspection_name text not null,
  inspected_at timestamptz not null,
  inspector text not null,
  inspector_user_id uuid references public.users(id),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.primary_packaging_inspections (
  inspection_id uuid primary key references public.inspections(id) on delete cascade,
  product_temp_f numeric,
  condensation_after_warmer public.acceptability_status,
  cap_status public.acceptability_status not null,
  cap_image_url text,
  filtec_status public.acceptability_status not null,
  filtec_image_url text,
  dry_after_warmer_status public.acceptability_status not null,
  dry_after_warmer_image_url text,
  label_alignment_status public.acceptability_status not null,
  label_alignment_image_url text,
  secure_seal_test_status public.acceptability_status not null,
  secure_seal_test_image_url text,
  date_code_status public.acceptability_status not null,
  date_code_image_url text
);

create table if not exists public.secondary_packaging_inspections (
  inspection_id uuid primary key references public.inspections(id) on delete cascade,
  stretch_wrap_quality_status public.acceptability_status not null,
  stretch_ratio numeric,
  layer_pad_status public.acceptability_status not null,
  layer_pads_per_pallet_status public.acceptability_status not null,
  pallet_tags_status public.acceptability_status not null,
  pallet_tag_info text,
  pallet_tag_photo_url text,
  stickers_status public.acceptability_status not null,
  sticker_info text,
  sticker_photo_url text,
  containment_force_top_kg numeric,
  containment_force_middle_kg numeric,
  containment_force_bottom_kg numeric,
  non_conformance_status public.completion_status,
  non_conformance_photo_url text,
  observations text
);

create table if not exists public.product_spec_inspections (
  inspection_id uuid primary key references public.inspections(id) on delete cascade,
  beverage_quality_measurement_id text
    references public.beverage_quality_measurements(beveragequalitymeasurementid),
  brand text not null,
  flavor text not null,
  package_size_ml numeric,
  fillheight numeric,
  brix numeric,
  co2_pressure numeric,
  co2_temperature numeric,
  co2_volume numeric,
  ph numeric,
  titratable_acidity numeric,
  vitamin_c numeric,
  closure_supplier text,
  net_completed boolean not null default false,
  cp_and_cpk_completed boolean not null default false,
  cip_completed boolean not null default false,
  cip_method text,
  cop_completed boolean not null default false,
  cop_chemical text,
  constraint product_spec_inspections_spec_snapshot_match
    foreign key (brand, flavor, package_size_ml)
    references public.beverage_quality_measurements(brand, flavor, packagesizeml)
);

create table if not exists public.product_spec_closure_measurements (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.product_spec_inspections(inspection_id) on delete cascade,
  measurement_number integer not null,
  application_angle numeric,
  removal_torque numeric,
  constraint product_spec_closure_measurements_number_uniq
    unique (inspection_id, measurement_number)
);

create index if not exists idx_beverage_quality_measurements_lookup
  on public.beverage_quality_measurements (brand, flavor, packagesizeml);

create index if not exists idx_production_runs_created_at
  on public.production_runs (created_at desc);

create index if not exists idx_production_runs_spec
  on public.production_runs (beverage_quality_measurement_id);

create index if not exists idx_inspections_run_created_at
  on public.inspections (production_run_id, created_at desc);

create index if not exists idx_inspections_type_created_at
  on public.inspections (inspection_type, created_at desc);
