import { db } from "@/lib/db";

const LOG_TO_DB = process.env.ENABLE_DB_LOGGING === "YES";
const LOG_TO_CONSOLE = process.env.ENABLE_CONSOLE_LOGGING !== "NO";

export class APILogger {
  public static async info<T>(message: string, body?: T) {
    const type = "INFO";
    const utcTime = new Date().toUTCString();
    const log = body ? JSON.stringify(body) : "";

    if (LOG_TO_CONSOLE) {
      console.info(`[${type}] [${utcTime}] [${message}]`, log);
    }
    if (LOG_TO_DB) {
      try {
        await db.log.create({ data: { type, message, utcTime } });
      } catch (error) {
        console.error("Failed to log to db");
      }
    }
  }
  public static async error<T>(message: string, body?: T) {
    const type = "ERROR";
    const utcTime = new Date().toUTCString();
    const log = body ? JSON.stringify(body) : "";

    if (LOG_TO_CONSOLE) {
      console.error(`[${type}] [${utcTime}] [${message}]`, log);
    }
    if (LOG_TO_DB) {
      try {
        await db.log.create({ data: { type, message, utcTime } });
      } catch (error) {
        console.error("Failed to log to db");
      }
    }
  }
}
