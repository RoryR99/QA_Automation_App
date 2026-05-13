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

create index if not exists idx_beverage_quality_measurements_lookup
  on public.beverage_quality_measurements (brand, flavor, packagesizeml);
