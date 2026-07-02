"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  AuthInput,
  AuthSession,
  continueAsGuest,
  getStoredSession,
  signInWithGoogle,
  signInWithPhone,
  signOut,
} from "@/lib/api";

const SESSION_CHANGE_EVENT = "medet-session-change";

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signInPhone: (input: AuthInput) => Promise<AuthSession>;
  signInGoogle: () => Promise<AuthSession>;
  continueGuest: () => void;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function subscribeToSessionChange(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore<AuthSession | null>(
    subscribeToSessionChange,
    getStoredSession,
    () => null
  );

  const signInPhone = useCallback((input: AuthInput) => signInWithPhone(input), []);
  const signInGoogle = useCallback(() => signInWithGoogle(), []);
  const continueGuest = useCallback(() => continueAsGuest(), []);
  const signOutUser = useCallback(() => signOut(), []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: !!session,
      signInPhone,
      signInGoogle,
      continueGuest,
      signOutUser,
    }),
    [continueGuest, session, signInGoogle, signInPhone, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
