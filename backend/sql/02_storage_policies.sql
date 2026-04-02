-- ===================================================================================
-- SUPABASE STORAGE MEDIA INIT
-- Description: Creates the default buckets and strict upload permissions.
-- ===================================================================================

-- 1. Create a public bucket for post images
insert into storage.buckets (id, name, public) 
values ('posts_media', 'posts_media', true)
on conflict (id) do nothing;

-- 2. Ensure storage object RLS is enabled
alter table storage.objects enable row level security;

-- 3. Make policies re-runnable
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow public viewing" on storage.objects;
drop policy if exists "Allow owner updates" on storage.objects;
drop policy if exists "Allow owner deletes" on storage.objects;

-- 4. Allow logged-in users to UPLOAD only inside their own folder: <uid>/...
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
	bucket_id = 'posts_media'
	and split_part(name, '/', 1) = auth.uid()::text
);

-- 5. Allow EVERYONE (public) to VIEW from 'posts_media'
create policy "Allow public viewing"
on storage.objects for select
to public
using (bucket_id = 'posts_media');

-- 6. Allow logged-in users to UPDATE only their own folder
create policy "Allow owner updates"
on storage.objects for update
to authenticated
using (
	bucket_id = 'posts_media'
	and split_part(name, '/', 1) = auth.uid()::text
)
with check (
	bucket_id = 'posts_media'
	and split_part(name, '/', 1) = auth.uid()::text
);

-- 7. Allow logged-in users to DELETE only their own folder
create policy "Allow owner deletes"
on storage.objects for delete
to authenticated
using (
	bucket_id = 'posts_media'
	and split_part(name, '/', 1) = auth.uid()::text
);
