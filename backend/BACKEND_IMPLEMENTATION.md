# Backend Implementation Plan

## 🏗️ Architecture & Features

### Core Apps Overview
The Django backend follows strict separation of concerns, divided into modular applications:
- **`users`**: Controls user profiles. Maps exactly to user profiles identified via Supabase Auth IDs.
- **`posts`**: Controls `Post` creation, mapping of `PostImage` (max 2 images/post tracked in a granular table), and interaction models (`Like`, `Comment`, `Share`).
- **`follows`**: Dedicated to database-level tracking of User-to-User `Follow` relations via constraint-checked models.
- **`notifications`**: Activity feed handling events triggered directly from the interactions (`like`, `comment`, `share`, `follow`, `new_post`).

### Tech Stack
- **Framework**: Django & Django REST Framework
- **Datastore**: Supabase Serverless Postgres
- **Auth**: Supabase Auth statelessly verified in Django via JWT decoding (`PyJWT`). No passwords sit in the Django DB.
- **File Storage**: Supabase Storage Buckets. Django provides presigned-URLs to safely funnel uploads straight from Client -> Supabase without bottle-necking standard APIs.

---

## 🚀 Local Development Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Python 3.1x or higher
- Git

### 2. Backend Environment Verification
Ensure you have a secure `.env` file in the `backend/` directory (you can use `.env.example` as a reference).

```bash
copy .env.example .env
```

Open `.env` and fill in the necessary keys. Most notably, you will need to provision a project in Supabase to fetch `SUPABASE_JWT_SECRET`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`.

### 3. Initialize Python Environment

Ensure you are in the `backend/` directory, and execute the following:

```bash
# 1. Provide your virtual environment setup
# To activate it:
# (Windows)
.\.venv\Scripts\activate
# (Mac/Linux)
source .venv/bin/activate

# 2. Ensure your dependencies are up-to-date
pip install django djangorestframework PyJWT django-cors-headers
```

### 4. Running the Initial Migrations
Once the local configuration mirrors the database schema required:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Start the Development Server
When the migrations are resolved, boot up the local API instance.

```bash
python manage.py runserver
```

You can now hit `http://127.0.0.1:8000/` safely.

---

## 🎨 Image Upload Protocol
1. Call `POST /api/posts/upload-urls/` with extensions to retrieve valid pre-signed Supabase URL targets.
2. Directly `PUT` images onto Supabase Storage securely.
3. Once completed client-side, POST your generic post details to `/api/posts/` specifying the finalized storage bucket references. 

---

## 🚢 Deployment (Railway)

### Files already prepared
- `Procfile`
- `railway.toml`

### Required Railway environment variables
- `DJANGO_SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=<your-railway-domain>`
- `CORS_ALLOW_ALL_ORIGINS=False`
- `DATABASE_URL=<supabase-pooler-connection-string>`
- `SUPABASE_URL=<your-supabase-url>`
- `SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- `SUPABASE_JWT_SECRET=<your-supabase-jwt-secret>`

### Post-deploy quick checks
1. `GET /api/health/` returns `status: ok`.
2. `GET /api/users/me/` works with `Authorization: Bearer <supabase-access-token>`.

---

## 🔗 Frontend Backend Link

In frontend environment:
- `EXPO_PUBLIC_API_URL=https://<your-railway-domain>`

Then restart Expo so the new URL is used.
