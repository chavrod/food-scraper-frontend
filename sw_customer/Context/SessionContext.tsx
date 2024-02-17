import React, { createContext, useContext, PropsWithChildren } from "react";
import { useCustomSession } from "@/hooks/useCustomSession";
import { Session } from "next-auth";

interface SessionState {
  session: Session | null;
  isLoading: boolean;
  isError: boolean;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export const SessionProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const { session, isLoading, isError } = useCustomSession({ required: false });
  const sessionState: SessionState = {
    session: session !== undefined ? session : null, // Ensure session is never undefined
    isLoading,
    isError,
  };

  return (
    <SessionContext.Provider value={sessionState}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionState => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
