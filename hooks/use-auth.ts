"use client";

import { createContext, useContext } from "react";

export type AuthUser = {
  uid: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
};

export type AuthState = {
  status: "loading" | "signed-out" | "signed-in";
  user: AuthUser | null;
};

export const LOADING_AUTH_STATE: AuthState = {
  status: "loading",
  user: null,
};

export const AuthContext = createContext<AuthState>(LOADING_AUTH_STATE);

/** The browser's Firebase Auth state: loading until it is restored, then signed in or out. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
