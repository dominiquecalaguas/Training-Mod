# Training-Mod

A Next.js app with Drizzle ORM and PostgreSQL (Supabase), deployed on Vercel.

## Tech stack

- **Framework:** Next.js 16
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle with `drizzle-kit` for migrations
- **Styling:** Tailwind CSS 4
- **Deployment:** Vercel (CI/CD)

## Project structure

- `next-app/` – Next.js application and Drizzle schema/migrations

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. Supabase)

### Setup

1. Clone the repo and go into the app:

   ```bash
   cd next-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in `next-app/` with:

   - `DATABASE_URL` – PostgreSQL connection string (e.g. Supabase connection string)
   - `SUPABASE_PASSWORD` – used in your connection string; keep this local only

4. Run migrations (if the DB is already set up):

   ```bash
   npm run db:migrate
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database migrations

Schema is defined in code under `next-app/src/db/schema/` (e.g. `users.ts`). To change the database:

1. Edit the schema in `next-app/src/db/schema/` (e.g. add/change tables or columns).
2. Generate migrations: `npm run db:generate` (writes to `next-app/drizzle/`).
3. Apply migrations: `npm run db:migrate`.
4. Commit the schema files and the `drizzle/` folder.

**Important:** Avoid hard-deleting columns (prefer deprecation/soft removal) to prevent downtime and broken functionality.

## Scripts (in `next-app/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run build:with-migrations` | Run migrations then build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run lint` | Run ESLint |

## Credentials

Sensitive values (e.g. `SUPABASE_PASSWORD`, `DATABASE_URL`) live in `.env` locally. Do not commit `.env`; it is gitignored.
