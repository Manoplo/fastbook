import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthSessionState = {
  session: Session | null;
  isLoading: boolean;
};

export const AuthSessionContext = createContext<AuthSessionState | null>(null);
