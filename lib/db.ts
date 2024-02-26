import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ||
  new PrismaClient({ log: [{ emit: "event", level: "query" }] });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
  if (db && process.env.ENABLE_PRISMA_QUERY_LOGGING === "YES") {
    db.$on("query" as never, (e: any) => {
      console.info("QUERY: " + `"${e.query}"`);
      console.info("DURATION: " + e.duration + "ms");
    });
  }
}
