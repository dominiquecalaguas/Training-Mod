/**
 * Run Drizzle migrations using postgres.js (same driver as the app).
 * Avoids drizzle-kit's pg driver, which can hit "Circuit breaker" with some hosts (e.g. Neon).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load .env then .env.local so we use the same DATABASE_URL as the app
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local");
  process.exit(1);
}

const postgres = (await import("postgres")).default;
const { drizzle } = await import("drizzle-orm/postgres-js");
const { migrate } = await import("drizzle-orm/postgres-js/migrator");

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
  ssl: "require",
});

const db = drizzle(sql);

console.log("Running migrations (postgres.js driver)...");
await migrate(db, { migrationsFolder: path.join(root, "drizzle") });
console.log("Migrations complete.");
await sql.end();
process.exit(0);
