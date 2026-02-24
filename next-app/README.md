
### Web Architecture

Vercel - CI/CD
Supabase - DB
Database library (ORM) - Drizzle, with PostgreSQL

### Credentials
They're in the `.env` file locally
- SUPABASE_PASSWORD


### For Database Changes
For DB migrations, we need to do the following:
- make the DB schema changes in `drizzle/`
- Run `npm run db:generate` and `npm run db:migrate`
- Push the DB migrations folders
