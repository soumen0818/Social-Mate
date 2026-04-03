-- ===================================================================================
-- BACKEND ROLE RLS ACCESS
-- Description: Allow Django backend DB role (postgres) to bypass app-table RLS safely.
-- ===================================================================================

-- users
DROP POLICY IF EXISTS "backend_postgres_all" ON public.users_user;
CREATE POLICY "backend_postgres_all"
ON public.users_user FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- posts
DROP POLICY IF EXISTS "backend_postgres_all" ON public.posts_post;
CREATE POLICY "backend_postgres_all"
ON public.posts_post FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "backend_postgres_all" ON public.posts_comment;
CREATE POLICY "backend_postgres_all"
ON public.posts_comment FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "backend_postgres_all" ON public.posts_like;
CREATE POLICY "backend_postgres_all"
ON public.posts_like FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "backend_postgres_all" ON public.posts_postimage;
CREATE POLICY "backend_postgres_all"
ON public.posts_postimage FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "backend_postgres_all" ON public.posts_share;
CREATE POLICY "backend_postgres_all"
ON public.posts_share FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- follows
DROP POLICY IF EXISTS "backend_postgres_all" ON public.follows_follow;
CREATE POLICY "backend_postgres_all"
ON public.follows_follow FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- notifications
DROP POLICY IF EXISTS "backend_postgres_all" ON public.notifications_notification;
CREATE POLICY "backend_postgres_all"
ON public.notifications_notification FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- django internal tables used by backend runtime
DROP POLICY IF EXISTS "backend_postgres_all" ON public.django_session;
CREATE POLICY "backend_postgres_all"
ON public.django_session FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "backend_postgres_all" ON public.django_migrations;
CREATE POLICY "backend_postgres_all"
ON public.django_migrations FOR ALL
TO postgres
USING (true)
WITH CHECK (true);
