import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lfkdpkordrcusqtaqmzh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxma2Rwa29yZHJjdXNxdGFxbXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzIxNzksImV4cCI6MjA5MzY0ODE3OX0.ji-DaPaNk9mNZDE_9y6gFPQd4gnoiA5xoEYy7qKdvzQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const SUPABASE_SCHEMA = `
-- Run this in your Supabase SQL editor to create all tables
-- Also run the ALTER statements if you already have existing tables

create table if not exists settings (
  id uuid default gen_random_uuid() primary key,
  claude_api_key text,
  user_name text default 'Theo',
  timezone text default 'Africa/Accra',
  phone_number text,
  created_at timestamptz default now()
);
alter table settings add column if not exists phone_number text;

create table if not exists people (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  phone_number text,
  last_contact_date date,
  notes text,
  follow_up_status text default 'Active',
  follow_up_due_date date,
  created_at timestamptz default now()
);
alter table people add column if not exists phone_number text;

create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  due_at timestamptz not null,
  person_id uuid references people(id) on delete set null,
  whatsapp_number text,
  whatsapp_message text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  role text not null,
  content text not null,
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

-- New tables for simplified daily ministry workflow

create table if not exists leaders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  phone_number text,
  last_contact_date date,
  follow_up_due_date date,
  follow_up_status text default 'Active',
  notes text,
  created_at timestamptz default now()
);

create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text default 'Vision',
  target_date date,
  notes text,
  next_action text,
  status text default 'Active',
  created_at timestamptz default now()
);

create table if not exists assistant_suggestions (
  id uuid default gen_random_uuid() primary key,
  suggestion_type text not null,
  title text not null,
  description text,
  action_json jsonb,
  related_person_name text,
  related_meeting_id uuid references meeting_notes(id) on delete set null,
  related_teaching_id uuid references teaching_calendar(id) on delete set null,
  related_goal_id uuid references goals(id) on delete set null,
  priority text default 'medium',
  status text default 'pending',
  created_at timestamptz default now(),
  acted_on_at timestamptz
);

-- Alter existing tables to add new columns

alter table assistant_suggestions add column if not exists priority text default 'medium';
alter table people add column if not exists issue_status text default 'No issue';

alter table teaching_calendar add column if not exists anchor_scripture text;
alter table teaching_calendar add column if not exists supporting_scriptures text;
alter table teaching_calendar add column if not exists main_summary text;
alter table teaching_calendar add column if not exists outline text;
alter table teaching_calendar add column if not exists discussion_questions text;
alter table teaching_calendar add column if not exists prayer_points text;
alter table teaching_calendar add column if not exists declarations text;
alter table teaching_calendar add column if not exists content_ideas text;
alter table teaching_calendar add column if not exists related_series text;

alter table meeting_notes add column if not exists agenda text;

alter table reminders add column if not exists related_meeting_id uuid references meeting_notes(id) on delete set null;
alter table reminders add column if not exists related_teaching_id uuid references teaching_calendar(id) on delete set null;
alter table reminders add column if not exists done boolean default false;

create table if not exists ministry_documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  doc_type text default 'Other',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists assistant_memory (
  id uuid default gen_random_uuid() primary key,
  key text not null,
  value text not null,
  category text default 'observation',
  source text default 'ai',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
`
