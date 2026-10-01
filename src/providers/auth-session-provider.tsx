import { useEffect, useState, type ReactNode } from "react";
import { getAuthSession, onAuthStateChange } from "@src/lib/auth-session";
import type { Session } from "@supabase/supabase-js";
import { AuthSessionContext, type AuthSessionState } from "./auth-session-context";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getAuthSession()
      .then((current) => {
        if (active) {
          setSession(current);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((next) => {
      setSession(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value: AuthSessionState = { session, isLoading };

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
