import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelLmit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "10 s"),
  ephemeralCache: new Map(),
  analytics: true,
});

export const withRateLimit = async (
  request: NextRequest,
  event: NextFetchEvent,
) => {
  const ip = request.ip;
  const { success, pending, limit, reset, remaining } = await ratelLmit.limit(
    `ratelimit_middleware_${ip}`,
  );

  event.waitUntil(pending);

  const res = success
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/api/blocked", request.url));

  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());

  return res;
};
