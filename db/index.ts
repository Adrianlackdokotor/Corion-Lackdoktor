import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Polyfill for rawSql to maintain compatibility with neon-http syntax used by Replit
export const rawSql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = '';
    for (let i = 0; i < strings.length; i++) {
        query += strings[i];
        if (i < values.length) {
            query += `$${i + 1}`;
        }
    }
    const res = await pool.query(query, values);
    return res.rows;
};
