import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import useSearchedProducts, { CustomRouter } from "@/hooks/useProducts";
import { IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import notifyError from "@/utils/notifyError";
import { useQueryClient } from "@tanstack/react-query";

interface GlobalContextType {
  loadingNewProducts: boolean;
}

// Define the props for GlobalProvider
interface GlobalProviderProps {
  children: ReactNode;
}

type Sockets = {
  [key: string]: WebSocket;
};

// Create the context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Provide the context
export function GlobalProvider({ children }: GlobalProviderProps) {
  const queryClient = useQueryClient();

  const { query, queryParams, firstTimeSearch, isUpdateNeeded } =
    useSearchedProducts();

  const [loadingNewProducts, setLoadingNewProducts] = useState(false);
  const [sockets, setSockets] = useState<Sockets>({});

  useEffect(() => {
    if ((firstTimeSearch || isUpdateNeeded) && query) {
      if (!sockets[query]) {
        openWebsocket(query, Boolean(isUpdateNeeded), firstTimeSearch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isUpdateNeeded, firstTimeSearch]);

  const openWebsocket = (
    query: string,
    isUpdateNeeded: boolean,
    firstTimeSearch: boolean
  ) => {
    const newSocket = new WebSocket(
      `ws://localhost:8000/ws/scraped_result/${query}/`
    );

    newSocket.onopen = () => {
      const messageData = {
        sender: "Client",
      };

      newSocket.send(JSON.stringify(messageData));

      if (isUpdateNeeded) {
        notifications.show({
          id: `update-needed-${query}`,
          title: "Records are outdated!",
          message: `We updating results for ${query}.`,
          color: "blue",
          loading: true,
          withBorder: true,
          autoClose: false,
          withCloseButton: false,
        });
      }
      if (firstTimeSearch) {
        setLoadingNewProducts(true);
      }
    };

    newSocket.onmessage = (event) => {
      const responseData = JSON.parse(event.data);

      setLoadingNewProducts(false);

      if (responseData.query) {
        handleWebsocketSuccess(
          query,
          responseData.query,
          isUpdateNeeded,
          firstTimeSearch
        );
      } else {
        notifications.hide(`update-needed-${query}`);
        notifyError({
          title: "Something went wrong, please try again...",
          message:
            responseData.message ||
            "Sorry, we were not able to get any results from your request.",
        });
        newSocket.close();
        setSockets((prevSockets) => {
          const { [query]: _, ...remainingSockets } = prevSockets;
          return remainingSockets;
        });
      }
    };

    newSocket.onerror = (error) => {
      notifications.hide(`update-needed-${query}`);
      notifyError({
        title: "Something went wrong, redirecting to home page...",
        message: "Lost connection.",
      });
      newSocket.close();
      setSockets((prevSockets) => {
        const { [query]: _, ...remainingSockets } = prevSockets;
        return remainingSockets;
      });
    };

    setSockets((prevSockets) => ({ ...prevSockets, [query]: newSocket }));
  };

  const [websocketResponseQuery, setWebsocketResponseQuery] = useState<
    string | null
  >(null);

  const handleWebsocketSuccess = (
    query: string,
    responseDataQuery: string,
    isUpdateNeeded: boolean,
    firstTimeSearch: boolean
  ) => {
    if (isUpdateNeeded) {
      notifications.update({
        id: `update-needed-${query}`,
        title: "Success!",
        message: `We finished putting updating records for ${query}`,
        icon: <IconCheck size="1rem" />,
        color: "green",
        withBorder: true,
        withCloseButton: true,
      });
    }
    if (firstTimeSearch) {
      notifications.show({
        title: "Success!",
        message: `We finished putting together results for ${query}`,
        icon: <IconCheck size="1rem" />,
        color: "green",
        withBorder: true,
        withCloseButton: true,
      });
    }

    setWebsocketResponseQuery(responseDataQuery);
  };

  useEffect(() => {
    if (websocketResponseQuery) {
      if (query === websocketResponseQuery && queryParams?.page) {
        queryClient.refetchQueries({
          queryKey: [
            "products",
            websocketResponseQuery,
            { page: queryParams?.page.toString() },
          ],
          exact: false,
        });
      }
      setTimeout(() => {
        queryClient.removeQueries({
          queryKey: ["products", websocketResponseQuery],
          exact: false,
        });
      }, 2000);
    }
  }, [websocketResponseQuery]);

  const contextValue = useMemo(
    () => ({
      loadingNewProducts,
    }),
    [loadingNewProducts]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  const context = useContext(GlobalContext);

  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
}
