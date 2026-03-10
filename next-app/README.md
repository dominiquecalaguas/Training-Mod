
### Web Architecture

Vercel - CI/CD
Supabase - DB
Database library (ORM) - Drizzle, with PostgreSQL

### Credentials
They're in the `.env` file locally
- SUPABASE_PASSWORD




### For Database Changes
For DB migrations, we need to do the following:
- Make the DB schema changes in `src/db/schema/` (e.g. `users.ts`)
- Run `npm run db:generate` (writes to `drizzle/`) and `npm run db:migrate`
- Push the schema files and the `drizzle/` folder

Never do hard deletes for DB columns, this is to prevent downtime and broken functionality
