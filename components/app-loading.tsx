import Image from "next/image";

/**
 * The full-page wait while sign-in state loads: the logo, centred, where the Android splash screen drew it. At 188px
 * the logo's glyph is the splash glyph's size (about 150dp tall), so the hand-over from the splash doesn't jump.
 */
export function AppLoading() {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center">
      <Image
        src="/images/logo.svg"
        className="dark:invert motion-safe:animate-pulse"
        alt=""
        height={188}
        width={188}
        priority
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
