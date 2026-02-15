-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  role text check (role in ('teacher', 'student')) default 'student',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create sessions table
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) not null,
  subject text not null,
  is_active boolean default true,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create attendance table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  student_id uuid references public.profiles(id) not null,
  verified_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Policies for sessions
create policy "Sessions are viewable by everyone." on public.sessions
  for select using (true);

create policy "Teachers can create sessions." on public.sessions
  for insert with check (
    auth.uid() = teacher_id and 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Teachers can update their own sessions." on public.sessions
  for update using (auth.uid() = teacher_id);

-- Policies for attendance
create policy "Attendance is viewable by everyone." on public.attendance
  for select using (true);

create policy "Students can mark attendance." on public.attendance
  for insert with check (
    auth.uid() = student_id and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student') -- Default to student if not provided
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime publication
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.attendance;
