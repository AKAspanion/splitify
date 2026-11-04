"use client";

import { useEffect, useState } from "react";
import { onUserChanged } from "@/lib/firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/app";
import {
  AuthContext,
  LOADING_AUTH_STATE,
  type AuthState,
} from "@/hooks/use-auth";

const SIGNED_OUT: AuthState = { status: "signed-out", user: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(LOADING_AUTH_STATE);

  useEffect(() => {
    try {
      return onUserChanged((user) => {
        if (!user) return setState(SIGNED_OUT);
        // The name is not part of onUserChanged's value; the current user holds it.
        const name = getFirebaseAuth().currentUser?.displayName ?? null;
        setState({
          status: "signed-in",
          user: { ...user, name: name || null },
        });
      });
    } catch (error) {
      // Firebase failed to start (a missing web config): nobody can be signed in.
      console.error("auth: could not start Firebase Auth", error);
      queueMicrotask(() => setState(SIGNED_OUT));
    }
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
