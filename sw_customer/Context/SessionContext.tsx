import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
} from "react";
import { useCustomSession } from "@/hooks/useCustomSession";
import { Session } from "next-auth";

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  isError: boolean;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const { session, isLoading, isError } = useCustomSession({ required: false });
  const sessionState = useMemo(
    () => ({
      session: session !== undefined ? session : null,
      isLoading,
      isError,
    }),
    [session, isLoading, isError]
  );

  return (
    <SessionContext.Provider value={sessionState}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionContext = (): SessionState => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
