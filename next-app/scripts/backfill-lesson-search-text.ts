/**
 * One-time backfill: set `search_text` from Lexical JSON in `content` for rows
 * where `search_text` IS NULL or empty (after trim). Uses DATABASE_URL.
 *
 * Run: npm run db:backfill:lesson-search-text
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { eq, isNull, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { lessons } from "../src/db/schema";
import { extractPlainText } from "../src/lib/lexical-search-text";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local");
  process.exit(1);
}

const client = postgres(connectionString, {
  max: 1,
  prepare: false,
  ssl: "require",
});

const db = drizzle(client);

async function main() {
  const rows = await db
    .select({
      id: lessons.id,
      content: lessons.content,
    })
    .from(lessons)
    .where(
      or(
        isNull(lessons.searchText),
        eq(lessons.searchText, ""),
        sql`length(btrim(${lessons.searchText})) = 0`,
      ),
    );

  console.log(
    `Found ${rows.length} lesson(s) with search_text null or empty (trim).`,
  );

  let updated = 0;
  for (const row of rows) {
    const searchText = extractPlainText(row.content);
    await db
      .update(lessons)
      .set({ searchText })
      .where(eq(lessons.id, row.id));
    updated += 1;
    console.log(`Updated lesson id=${row.id} (search_text length=${searchText.length})`);
  }

  console.log(`Done. Updated ${updated} row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
