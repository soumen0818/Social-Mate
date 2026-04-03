-- ===================================================================================
-- SUPABASE AUTHENTICATION HOOK FOR DJANGO
-- Description: Automatically mirrors new Supabase Auth users into Django's users_user table.
-- ===================================================================================

-- 1. Create the function that translates the auth.users row into public.users_user
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user'
  );
  generated_username := left(generated_username, 141) || '-' || substring(replace(new.id::text, '-', ''), 1, 8);

  insert into public.users_user (
    id, 
    username, 
    email, 
    password,
    display_name, 
    bio,
    avatar_url,
    is_active,
    is_staff,
    is_superuser,
    created_at, 
    updated_at
  )
  values (
    new.id, 
    generated_username,
    new.email,
    '!', -- unusable Django password; Supabase manages auth
    -- Pull the name out of user_metadata if the frontend passed it during signUp()
    coalesce(new.raw_user_meta_data->>'name', ''),
    '',   -- empty bio
    null, -- empty avatar initially
    true, -- is_active
    false, -- is_staff
    false, -- is_superuser
    now(),
    now()
  )
  on conflict (id) do update set
    username = excluded.username,
    email = excluded.email,
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url,
    is_active = excluded.is_active,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer
set search_path = public, pg_temp;

-- 2. Bind the function to the auth.users table via a Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
