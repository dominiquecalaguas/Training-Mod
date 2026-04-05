import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const parsedPoolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
const poolMax =
  Number.isFinite(parsedPoolMax) && parsedPoolMax > 0 ? parsedPoolMax : 10;

export const postgresClient = postgres(connectionString, {
  max: poolMax,
  prepare: false,
  ssl: "require",
});

export const db = drizzle(postgresClient, { schema });

