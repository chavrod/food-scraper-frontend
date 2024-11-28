import { useEffect, createContext, useState, ReactNode, FC } from "react";
import { getAuth, getConfig } from "./api";

interface AuthContextProviderProps {
  children: ReactNode;
}

type AuthFlow = {
  id: string;
  is_pending: boolean;
};

type User = {
  id: string;
};

export type AuthType = {
  status: number;
  data: {
    flows?: AuthFlow[];
    user?: User;
    methods: any;
  };
  meta: {
    is_authenticated: boolean;
  };
};

interface AuthContextType {
  auth: AuthType;
  config: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function Loading() {
  return <div>Starting...</div>;
}

function LoadingError() {
  return <div>Loading error!</div>;
}

export const AuthContextProvider: FC<AuthContextProviderProps> = ({
  children,
}) => {
  const [auth, setAuth] = useState<AuthType | false | undefined>(undefined);
  const [config, setConfig] = useState<any | undefined>(undefined);

  useEffect(() => {
    function onAuthChanged(e: CustomEvent) {
      setAuth((auth: AuthType | boolean | undefined) => {
        if (typeof auth === "undefined") {
          console.log("Authentication status loaded");
        } else {
          console.log("Authentication status updated");
        }
        return e.detail;
      });
    }

    document.addEventListener(
      "allauth.auth.change",
      onAuthChanged as EventListener
    );
    getAuth()
      .then((data) => setAuth(data))
      .catch((e) => {
        console.error(e);
        setAuth(false);
      });
    getConfig()
      .then((data) => setConfig(data))
      .catch((e) => {
        console.error(e);
      });
    return () => {
      document.removeEventListener(
        "allauth.auth.change",
        onAuthChanged as EventListener
      );
    };
  }, []);
  const loading = typeof auth === "undefined" || config?.status !== 200;

  // Only provide a value to AuthContext.Provider when auth is correctly typed
  if (loading || auth === false) {
    return loading ? <Loading /> : <LoadingError />;
  }

  return (
    <AuthContext.Provider value={{ auth, config }}>
      {children}
    </AuthContext.Provider>
  );
};
