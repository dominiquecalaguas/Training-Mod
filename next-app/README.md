
### Web Architecture

Vercel - CI/CD
Supabase - DB
Database library (ORM) - Drizzle, with PostgreSQL

### Credentials
They're in the `.env` file locally
- SUPABASE_PASSWORD

### Analytics (optional)
For PostHog analytics (dashboard, course/lesson clicks):
- `NEXT_PUBLIC_POSTHOG_KEY` – PostHog project API key (client)
- `NEXT_PUBLIC_POSTHOG_HOST` – e.g. `https://us.i.posthog.com` (defaults to US cloud if omitted)
- `POSTHOG_PERSONAL_API_KEY` – Personal API key with `query:read` scope (for dashboard analytics API)
- `POSTHOG_PROJECT_ID` – PostHog project ID (from Project Settings in PostHog)
- `POSTHOG_HOST` – Optional; server-side PostHog host (defaults to `NEXT_PUBLIC_POSTHOG_HOST` or US cloud)


### For Database Changes
For DB migrations, we need to do the following:
- Make the DB schema changes in `src/db/schema/` (e.g. `users.ts`)
- Run `npm run db:generate` (writes to `drizzle/`) and `npm run db:migrate`
- Push the schema files and the `drizzle/` folder

Never do hard deletes for DB columns, this is to prevent downtime and broken functionality
