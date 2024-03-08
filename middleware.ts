import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/privacy",
    "/api/webhook/clerk",
    "/api/uploadthing",
    "/api/test(.*)",
    "/api/health-check(.*)",
  ],
  ignoredRoutes: ["/api/webhook/clerk", "/api/health-check"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
