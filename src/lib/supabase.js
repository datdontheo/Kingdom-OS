import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lfkdpkordrcusqtaqmzh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma2Rwa29yZHJjdXNxdGFxbXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzIxNzksImV4cCI6MjA5MzY0ODE3OX0.ji-DaPaNk9mNZDE_9y6gFPQd4gnoiA5xoEYy7qKdvzQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const SUPABASE_SCHEMA = `
-- Run this in your Supabase SQL editor to create all tables

create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  claude_api_key text,
  user_name text default 'Theo',
  timezone text default 'Africa/Accra',
  created_at timestamptz default now()
);

create table if not exists people (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  last_contact_date date,
  notes text,
  follow_up_status text default 'Active',
  follow_up_due_date date,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text default 'Admin',
  priority text default 'Medium',
  status text default 'Not started',
  due_date date,
  assigned_to text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists teaching_calendar (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  date date not null,
  venue text,
  topic text,
  scripture text,
  preparation_status text default 'Not started',
  notes text,
  created_at timestamptz default now()
);

create table if not exists vision_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  owner text,
  start_date date,
  target_date date,
  status text default 'Planning',
  notes text,
  created_at timestamptz default now()
);

create table if not exists project_milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references vision_projects(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists meeting_notes (
  id uuid default gen_random_uuid() primary key,
  meeting_type text not null,
  date date not null,
  attendees text,
  key_decisions text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists meeting_action_items (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meeting_notes(id) on delete cascade,
  title text not null,
  owner text,
  due_date date,
  status text default 'Not started',
  created_at timestamptz default now()
);
`
