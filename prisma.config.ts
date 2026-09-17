// Purpose: Prisma CLI configuration (database URL, migrations path).
// Constraints: Use DIRECT_URL for migrations; runtime client uses DATABASE_URL via adapter in src/lib/prisma.ts.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
