import { useContext } from "react";
import { AuthSessionContext, type AuthSessionState } from "@src/providers/auth-session-context";

export function useAuthSession(): AuthSessionState {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession debe usarse dentro de AuthSessionProvider");
  }
  return value;
}
