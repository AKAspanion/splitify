import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // process.env rather than prisma's env(), which throws when the key is missing: `prisma generate` doesn't need
    // a database, and Prisma 5 let it run without one.
    url: process.env.DATABASE_URL,
  },
});
