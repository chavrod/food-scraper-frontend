import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
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

// Create the context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Provide the context
export function GlobalProvider({ children }: GlobalProviderProps) {
  const router = useRouter() as CustomRouter;

  const queryClient = useQueryClient();

  const { query, isUpdatingProduct } = useSearchedProducts();

  const [loadingNewProducts, setLoadingNewProducts] = useState(false);
  useEffect(() => {
    if (isUpdatingProduct && query) {
      setLoadingNewProducts(true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        // Sending a message to the server after connection
        const messageData = {
          query,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        const responseData = JSON.parse(event.data);
        setLoadingNewProducts(false);

        if (responseData.query) {
          notifications.show({
            title: "Success!",
            message: `We finished putting together results for ${responseData.query}`,
            icon: <IconCheck size="1rem" />,
            color: "green",
            withBorder: true,
          });

          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ["products", { query: responseData.query }],
              refetchType: "active",
            });
            // requestedProducts.request({ query: responseData.query, page: 1 });
          }, 1000);
        } else {
          const errorMsg =
            responseData.message ||
            "Sorry, we were not able to get any results from your request.";
          notifyError({
            title: "Something went wrong, redirecting to home page...",
            message: errorMsg,
          });
          router.push("/");
        }
        socket.close();
      };

      socket.onerror = (error) => {
        notifyError({
          title: "Something went wrong, redirecting to home page...",
          message: "Lost connection.",
        });
        router.push("/");
      };

      // Cleanup the socket connection on component unmount
      return () => {
        socket.close();
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdatingProduct]);

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
