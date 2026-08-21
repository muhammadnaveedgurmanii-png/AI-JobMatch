import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 1,
});

try {
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(
      new URL("../lib/db/drizzle", import.meta.url),
    ),
  });
  console.log("Database migrations are up to date.");
} finally {
  await pool.end();
}