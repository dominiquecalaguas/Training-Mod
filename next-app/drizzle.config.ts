import path from "node:path";
import { config } from "dotenv";

// Load .env then .env.local (local overrides) so db:migrate uses same credentials as the app
config();
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
