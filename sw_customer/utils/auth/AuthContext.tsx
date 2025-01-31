import { useEffect, createContext, useState, ReactNode, FC } from "react";
import { getAuth, getConfig, Flows } from "./api";

interface AuthContextProviderProps {
  children: ReactNode;
}

// type FlowId = (typeof Flows)[keyof typeof Flows];
export type AuthFlow = {
  id: (typeof Flows)[keyof typeof Flows];
  is_pending: boolean;
};

type User = {
  id: string;
  username: string;
  email: string;
};

export type AuthRes = {
  status: number;
  data: {
    flows?: AuthFlow[];
    user?: User;
    methods?: any;
    email?: string;
  };
  meta: {
    is_authenticated: boolean;
    access_token?: string;
  };
};

interface AuthContextType {
  auth?: AuthRes | boolean;
  config?: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider: FC<AuthContextProviderProps> = ({
  children,
}) => {
  console.log("AuthContextProvider render");
  const [auth, setAuth] = useState<AuthRes | false | undefined>(undefined);
  const [config, setConfig] = useState<any | undefined>(undefined);

  useEffect(() => {
    console.log("UseEffect triggered");
    function onAuthChanged(e: CustomEvent) {
      setAuth((auth: AuthRes | boolean | undefined) => {
        if (typeof auth === "undefined") {
          console.log("Authentication status loaded");
        } else {
          console.log("Authentication status updated");
          console.log("auth: ", auth);
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

  console.log("AUTH: ", auth);
  console.log("CONFIG: ", config);

  return (
    <AuthContext.Provider value={{ auth, config }}>
      {children}
    </AuthContext.Provider>
  );
};
