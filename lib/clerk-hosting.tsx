"use client";

// Stands in for "@clerk/nextjs" in the hosting build only (see next.config.mjs). The hosting build serves the
// public pages and has no Clerk account or key, so nobody is ever signed in here.
import type { ReactNode } from "react";

type StubUser = {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
};

export const ClerkProvider = ({
  children,
}: {
  children?: ReactNode;
  appearance?: unknown;
}) => <>{children}</>;

export const ClerkLoaded = ({ children }: { children?: ReactNode }) => (
  <>{children}</>
);

export const ClerkLoading = (_props: { children?: ReactNode }) => null;

export const UserButton = (_props: Record<string, unknown>) => null;

export const useUser = (): {
  isLoaded: true;
  isSignedIn: false;
  user: StubUser | null;
} => ({ isLoaded: true, isSignedIn: false, user: null });

export const useAuth = () => ({
  isLoaded: true as const,
  isSignedIn: false as const,
  userId: null,
  getToken: async (): Promise<string | null> => null,
});
