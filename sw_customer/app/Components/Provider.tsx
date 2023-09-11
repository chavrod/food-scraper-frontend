"use-client";

import { SessionProvider } from "next-auth/react";

import React from "react"; // You need this import for React.ReactNode

interface ProviderProps {
  children: React.ReactNode;
}

const Provider: React.FC<ProviderProps> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default Provider;
