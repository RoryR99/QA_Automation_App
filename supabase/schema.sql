create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  display_name text not null,
  user_principal_name text not null,
  role text not null,
  site text not null
);

create table if not exists public.production_runs (
  id text primary key,
  productioncode text not null,
  brand text not null,
  flavour text not null,
  package_type text not null,
  line text not null,
  shift text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hourly_inspections (
  id text primary key,
  inspection_type text not null,
  created_at timestamptz not null default timezone('utc', now()),
  payload_json jsonb not null
);

create table if not exists public.inspection_extensions (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  payload_json jsonb not null
);

create table if not exists public.closure_measurements (
  id text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  payload_json jsonb not null
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
