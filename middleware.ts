import { authMiddleware } from "@clerk/nextjs";
import { withRateLimit } from "./middleware/rate-limit";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in*",
    "/sign-up*",
    "/api/webhook/clerk",
    "/api/uploadthing",
    "/api/health-check",
    "/api/blocked",
  ],
  beforeAuth: (req, event) => {
    return withRateLimit(req, event);
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
