import { NextResponse, NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";

// Add public paths for Clerk to handle.
const publicPaths = [
  "/",
  "/sign-in*",
  "/sign-up*",
  "/api/webhook/clerk",
  "/api/uploadthing",
  "/api/health-check",
  "/api/blocked",
];

// set your rate limit.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "10 s"),
  ephemeralCache: new Map(),
  analytics: true,
});

// This checks if the pathname you are is public
const isPublic = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/|\\.)"))),
  );
};
// this checks if you are hitting an API
const isAPI = (path: string) => {
  return path.match(new RegExp(`^\/api\/`));
};

export default withClerkMiddleware(
  async (request: NextRequest, event: NextFetchEvent) => {
    //Rate limit apis.
    if (
      isAPI(request.nextUrl.pathname) &&
      request.nextUrl.pathname !== "/api/blocked"
    ) {
      const ip = request.ip;
      const { success, pending, limit, reset, remaining } =
        await ratelimit.limit(`ratelimit_middleware_${ip}`);
      event.waitUntil(pending);

      const res = success
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/api/blocked", request.url));

      res.headers.set("X-RateLimit-Limit", limit.toString());
      res.headers.set("X-RateLimit-Remaining", remaining.toString());
      res.headers.set("X-RateLimit-Reset", reset.toString());
      return res;
    }
    // do nothing
    if (isPublic(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    // if the user is not signed in redirect them to the sign in page.
    const { userId } = getAuth(request);

    if (!userId) {
      // redirect the users to /pages/sign-in/[[...index]].ts

      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  },
);

// Stop Middleware running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     */
    "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)",
    "/",
  ],
};

// import { authMiddleware } from "@clerk/nextjs";

// export default authMiddleware({
//   publicRoutes: [
//     "/",
//     "/api/webhook/clerk",
//     "/api/uploadthing",
//     "/api/test(.*)",
//     "/api/health-check(.*)",
//   ],
//   ignoredRoutes: ["/api/webhook/clerk", "/api/health-check"],
// });

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
// };
