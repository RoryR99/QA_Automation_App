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
  status text not null default 'active',
  closed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint production_runs_status_check
    check (status in ('active', 'closed')),
  constraint production_runs_closed_at_check
    check ((status = 'active' and closed_at is null) or (status = 'closed' and closed_at is not null))
);

alter table public.production_runs
  add column if not exists status text not null default 'active';

alter table public.production_runs
  add column if not exists closed_at timestamptz;

create table if not exists public.production_run_batches (
  id text primary key,
  production_run_id text not null references public.production_runs(id) on delete cascade,
  batch_number text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint production_run_batches_number_not_blank
    check (length(trim(batch_number)) > 0),
  constraint production_run_batches_unique
    unique (production_run_id, batch_number)
);

create table if not exists public.hourly_inspections (
  id text primary key,
  production_run_id text not null references public.production_runs(id) on delete cascade,
  inspection_type text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.primary_packaging_inspections (
  inspection_id text primary key references public.hourly_inspections(id) on delete cascade,
  product_temp_f numeric,
  condensation_after_warmer text,
  cap_status text not null,
  cap_image_url text,
  filtec_status text not null,
  filtec_image_url text,
  dry_after_warmer_status text not null,
  dry_after_warmer_image_url text,
  label_alignment_status text not null,
  label_alignment_image_url text,
  secure_seal_test_status text not null,
  secure_seal_test_image_url text,
  date_code_status text not null,
  date_code_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint primary_packaging_condensation_check
    check (condensation_after_warmer is null or condensation_after_warmer in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_cap_check
    check (cap_status in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_filtec_check
    check (filtec_status in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_dry_after_warmer_check
    check (dry_after_warmer_status in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_label_alignment_check
    check (label_alignment_status in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_secure_seal_check
    check (secure_seal_test_status in ('acceptable', 'non-acceptable')),
  constraint primary_packaging_date_code_check
    check (date_code_status in ('acceptable', 'non-acceptable'))
);

create table if not exists public.secondary_packaging_inspections (
  inspection_id text primary key references public.hourly_inspections(id) on delete cascade,
  stretch_wrap_quality_status text not null,
  stretch_ratio numeric,
  layer_pad_status text not null,
  layer_pads_per_pallet_status text not null,
  pallet_tags_status text not null,
  pallet_tag_info text,
  pallet_tag_photo_url text,
  stickers_status text not null,
  sticker_info text,
  sticker_photo_url text,
  containment_force_top_kg numeric,
  containment_force_middle_kg numeric,
  containment_force_bottom_kg numeric,
  non_conformance_status text,
  non_conformance_photo_url text,
  observations text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint secondary_packaging_stretch_wrap_check
    check (stretch_wrap_quality_status in ('acceptable', 'non-acceptable')),
  constraint secondary_packaging_layer_pad_check
    check (layer_pad_status in ('acceptable', 'non-acceptable')),
  constraint secondary_packaging_layer_pads_per_pallet_check
    check (layer_pads_per_pallet_status in ('acceptable', 'non-acceptable')),
  constraint secondary_packaging_pallet_tags_check
    check (pallet_tags_status in ('acceptable', 'non-acceptable')),
  constraint secondary_packaging_stickers_check
    check (stickers_status in ('acceptable', 'non-acceptable')),
  constraint secondary_packaging_non_conformance_check
    check (non_conformance_status is null or non_conformance_status in ('completed', 'not-completed'))
);

create table if not exists public.product_spec_inspections (
  inspection_id text primary key references public.hourly_inspections(id) on delete cascade,
  beverage_quality_measurement_id text references public.beverage_quality_measurements(beveragequalitymeasurementid),
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
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_spec_closure_measurements (
  id text primary key,
  inspection_id text not null references public.product_spec_inspections(inspection_id) on delete cascade,
  measurement_number integer not null,
  application_angle numeric,
  removal_torque numeric,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_spec_closure_measurements_number_uniq
    unique (inspection_id, measurement_number)
);

create table if not exists public.beverage_quality_measurements (
  beveragequalitymeasurementid text primary key,
  brand text not null,
  brixmeasurementfrequency text,
  brixlowerlimit numeric,
  brixupperlimit numeric,
  co2measurementfrequency text,
  co2lowerlimit numeric,
  co2upperlimit numeric,
  createdby text,
  createdbydelegate text,
  createdbydelegatelookup text,
  createdbylookup text,
  createdon timestamptz,
  fillheightmeasurementfrequency text,
  fillheightlowerlimit numeric,
  fillheightupperlimit numeric,
  flavor text not null,
  importsequencenumber bigint,
  modifiedby text,
  modifiedbydelegate text,
  modifiedbydelegatelookup text,
  modifiedbylookup text,
  modifiedon timestamptz,
  owner text,
  ownerlookup text,
  owningbusinessunit text,
  owningbusinessunitlookup text,
  owningteam text,
  owningteamlookup text,
  packagesizeml numeric,
  phmeasurementfrequency text,
  phlowerlimit numeric,
  phupperlimit numeric,
  productspecification text,
  recordcreatedon timestamptz,
  status text,
  statusreason text,
  statuscode integer,
  statecode integer,
  titratableaciditymeasurementfrequ text,
  titratableaciditylowerlimit numeric,
  titratableacidityupperlimit numeric,
  timezoneruleversionnumber integer,
  utcconversiontimezonecode integer,
  versionnumber bigint,
  vitamincmeasurementfrequency text,
  vitaminclowerlimit numeric,
  vitamincupperlimit numeric
);

create index if not exists idx_hourly_inspections_production_run_id
  on public.hourly_inspections (production_run_id, created_at desc);

create index if not exists idx_production_run_batches_production_run_id
  on public.production_run_batches (production_run_id, created_at);

create index if not exists idx_beverage_quality_measurements_lookup
  on public.beverage_quality_measurements (brand, flavor, packagesizeml);

create index if not exists idx_product_spec_inspections_lookup
  on public.product_spec_inspections (brand, flavor, package_size_ml);
