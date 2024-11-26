import { useEffect, createContext, useState, ReactNode, FC } from "react";
import { getAuth, getConfig } from "./api";

interface AuthContextType {
  auth: any;
  config: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function Loading() {
  return <div>Starting...</div>;
}

function LoadingError() {
  return <div>Loading error!</div>;
}

interface AuthContextProviderProps {
  children: ReactNode;
}

type AuthFlow = {
  is_pending: boolean;
};

export type AuthType = {
  status: number;
  data: {
    flows: AuthFlow[];
  };
  meta: {
    is_authenticated: boolean;
  };
};

export const AuthContextProvider: FC<AuthContextProviderProps> = ({
  children,
}) => {
  const [auth, setAuth] = useState<any | undefined>(undefined);
  const [config, setConfig] = useState<any | undefined>(undefined);

  useEffect(() => {
    function onAuthChanged(e: CustomEvent) {
      setAuth((auth: AuthType | undefined) => {
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
  return (
    <AuthContext.Provider value={{ auth, config }}>
      {loading ? <Loading /> : auth === false ? <LoadingError /> : children}
    </AuthContext.Provider>
  );
};
