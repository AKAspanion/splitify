import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const createClient = () =>
  new PrismaClient({
    // Prisma 7 connects through a driver adapter; the MariaDB driver talks to MySQL and reads the mysql:// URL.
    adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
    log: [{ emit: "event", level: "query" }],
  });

export const db = globalThis.prisma || createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
  if (db && process.env.ENABLE_PRISMA_QUERY_LOGGING === "YES") {
    db.$on("query" as never, (e: any) => {
      console.info("QUERY: " + `"${e.query}"`);
      console.info("DURATION: " + e.duration + "ms");
    });
  }
}
