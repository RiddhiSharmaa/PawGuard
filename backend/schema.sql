create extension if not exists pgcrypto;

create table if not exists dogs (
  id uuid default gen_random_uuid() primary key,
  image_url text,
  latitude float,
  longitude float,
  location_address text,
  description text,
  priority text,
  is_injured boolean,
  is_aggressive boolean,
  estimated_age text,
  condition text,
  rescue_needed boolean,
  status text default 'reported',
  ngo_name text,
  ngo_email text,
  rescue_email_body text,
  triage_reasoning text,
  reported_at timestamptz default now(),
  followup_at timestamptz,
  is_vaccinated boolean default false,
  is_duplicate boolean default false
);

create table if not exists ngos (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  phone text,
  city text,
  latitude float,
  longitude float,
  specialization text
);

insert into ngos (name, email, phone, city, latitude, longitude, specialization) values
('Friendicoes SECA', 'friendicoes@gmail.com', '011-24373347', 'Delhi', 28.5672, 77.2100, 'injured'),
('Jeev Ashram', 'jeevashram@gmail.com', '011-27654321', 'Delhi', 28.7041, 77.1025, 'general'),
('Charlie Animal Rescue', 'charlie.rescue@gmail.com', '9810012345', 'Delhi', 28.6280, 77.3649, 'abandoned'),
('People For Animals Delhi', 'pfa.delhi@gmail.com', '011-23326579', 'Delhi', 28.6139, 77.2090, 'general')
on conflict do nothing;
