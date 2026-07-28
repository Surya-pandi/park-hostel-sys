# PCET Hostel Attendance Management System

Production-ready Next.js 16 application for PARK COLLEGE OF ENGINEERING AND TECHNOLOGY hostel attendance management.

## Features

- Role-based dashboards for Student, four hostel Wardens, AO, and Director
- Supabase Auth and PostgreSQL-ready data access
- Dynamic signed QR attendance with 60-second expiry, nonce, UUID, and HMAC signature
- Server-side scan verification, single-use token flow, and one-attendance-per-day rule
- Weekly food menu submission by wardens with director approval before student visibility
- Supabase RLS policies for students, wardens, AO, and director
- Realtime-ready dashboard data model
- CSV, Excel, and PDF report exports
- Responsive Tailwind CSS and shadcn-style UI primitives
- Dark mode, Framer Motion transitions, charts, and audit-log schema

## Tech Stack

- Next.js 16 App Router, TypeScript, Server Actions
- Tailwind CSS 4, shadcn/ui conventions, Framer Motion
- Supabase Auth, PostgreSQL, RLS, Realtime-ready schema
- Recharts, qrcode.react, html5-qrcode, XLSX, jsPDF
- Vercel-ready deployment

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`.

Supabase environment variables are required for authentication and live data.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set Supabase URL, anon key, service role key, and `QR_SIGNING_SECRET`.
3. Apply the migration:

```bash
supabase db push
```

4. In Vercel, set the same environment variables. Keep `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` server-only.

## Vercel Deployment

- Framework Preset: `Next.js`
- Root Directory: project root, not the empty `hostel-attendance-system` folder
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty/default for Next.js
- Environment Variables: copy the keys from `.env.example` into Vercel project settings

If Vercel shows `404: NOT_FOUND` before your app UI loads, confirm the production domain is assigned to the latest successful deployment and that the root directory points to this folder.

## Default Student Login Policy

Registered students use:

- Username: email
- Default password: date of birth in `DD-MM-YYYY` format
- `force_password_change`: true

## Project Structure

- `src/app` - routes and server actions
- `src/components/app` - dashboards and feature components
- `src/components/ui` - shadcn-style primitives
- `src/lib` - constants, validation, QR signing, Supabase clients, live data loaders
- `supabase/migrations` - normalized database schema, indexes, RLS policies

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```
