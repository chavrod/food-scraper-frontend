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

  const { query, queryParams, noProductButScrapingUnderWay, isUpdateNeeded } =
    useSearchedProducts();

  const [loadingNewProducts, setLoadingNewProducts] = useState(false);
  const [sockets, setSockets] = useState<Sockets>({});

  console.log("sockets: ", sockets);

  const openWebsocket = (
    query: string,
    isUpdateNeeded: boolean,
    noProductButScrapingUnderWay: boolean
  ) => {
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
    if (noProductButScrapingUnderWay) {
      setLoadingNewProducts(true);
    }

    const newSocket = new WebSocket(
      `ws://localhost:8000/ws/scraped_result/${query}/`
    );

    newSocket.onopen = () => {
      const messageData = {
        sender: "Client",
      };

      newSocket.send(JSON.stringify(messageData));
    };

    newSocket.onmessage = (event) => {
      const responseData = JSON.parse(event.data);

      setLoadingNewProducts(false);

      if (responseData.query) {
        handleWebsocketSuccess(
          query,
          responseData.query,
          isUpdateNeeded,
          noProductButScrapingUnderWay
        );
      } else {
        const errorMsg =
          responseData.message ||
          "Sorry, we were not able to get any results from your request.";
        notifyError({
          title: "Something went wrong, redirecting to home page...",
          message: errorMsg,
        });
        // TODO: Handle error well
        // router.push("/");
        newSocket.close();
        setSockets((prevSockets) => {
          const { [query]: _, ...remainingSockets } = prevSockets;
          return remainingSockets;
        });
      }
    };

    newSocket.onerror = (error) => {
      notifications.hide("update-needed");
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

  useEffect(() => {
    if ((noProductButScrapingUnderWay || isUpdateNeeded) && query) {
      if (!sockets[query]) {
        openWebsocket(
          query,
          Boolean(isUpdateNeeded),
          noProductButScrapingUnderWay
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isUpdateNeeded, noProductButScrapingUnderWay]);

  const handleWebsocketSuccess = (
    query: string,
    responseDataQuery: string,
    isUpdateNeeded: boolean,
    noProductButScrapingUnderWay: boolean
  ) => {
    console.log("query", query);
    console.log("responseDataQuery", responseDataQuery);
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
    if (noProductButScrapingUnderWay) {
      notifications.show({
        title: "Success!",
        message: `We finished putting together results for ${query}`,
        icon: <IconCheck size="1rem" />,
        color: "green",
        withBorder: true,
        withCloseButton: true,
      });
    }

    // console.log("query === responseDataQuery", query === responseDataQuery);
    // console.log("queryParams.page.toString() ", queryParams.page.toString());
    if (query === responseDataQuery) {
      queryClient.refetchQueries({
        queryKey: [
          "products",
          responseDataQuery,
          { page: queryParams.page.toString() },
        ],
        exact: false,
      });
    }
    setTimeout(() => {
      queryClient.removeQueries({
        queryKey: ["products", responseDataQuery],
        exact: false,
      });
    }, 2000);
  };

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
