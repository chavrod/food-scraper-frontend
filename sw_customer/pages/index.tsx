import { useState, useEffect } from "react";
import { IconCheck } from "@tabler/icons-react";
import { useRouter, NextRouter } from "next/router";
import { Stack, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import BasketPreview from "@/Components/BasketPreview";
import notifyError from "@/utils/notifyError";
import SearchResults from "@/Components/SearchResults";
import NoSsr from "@/utils/NoSsr";
import { useGlobalContext } from "@/Context/globalContext";
import { SearchParams } from "@/types/customer_types";

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

type CustomRouter = NextRouter & {
  query: SearchParams;
};

export default function HomePage() {
  const router = useRouter() as CustomRouter;

  const {
    requestedProducts,
    averageScrapingTime,
    searchedProducts,
    searchedProductMetadata,
  } = useGlobalContext();

  const [loadingNew, setLoadingNew] = useState(false);

  // Function to normalize query parameters
  const normalizeQueryParams = (params: SearchParams) => {
    return Object.entries(params).reduce(
      (acc: { [key: string]: string }, [key, value]) => {
        if (value !== undefined) {
          // Check if value is not undefined
          acc[key] = value.toString().toLowerCase();
        }
        return acc;
      },
      {}
    );
  };

  useEffect(() => {
    const queryParams = normalizeQueryParams(router.query);

    if (queryParams.query) {
      requestedProducts.request(queryParams);
    }
  }, [router.query]);

  useEffect(() => {
    if (averageScrapingTime && router.query.query) {
      setLoadingNew(true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: router.query.query,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        console.log("MESSAGE RECEIVED");
        const responseData = JSON.parse(event.data);

        if (responseData.query) {
          notifications.show({
            title: "Success!",
            message: `We finished putting together results for ${responseData.query}`,
            icon: <IconCheck size="1rem" />,
            color: "green",
            withBorder: true,
          });
          setTimeout(() => {
            requestedProducts.request({ query: responseData.query, page: 1 });
          }, 1000);
        } else {
          const error_msg =
            responseData.message ||
            "Sorry, we were not able to get any results from your request.";
          notifyError({
            title: "Something went wrong, redirecting to home page...",
            message: error_msg,
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
  }, [averageScrapingTime]);

  return (
    <>
      <Flex
        justify={
          !requestedProducts.loading && !searchedProducts
            ? "center"
            : "space-between"
        }
        align={
          !requestedProducts.loading && !searchedProducts
            ? "center"
            : "flex-start"
        }
        direction="row"
        wrap="nowrap"
        style={{ width: "100%", height: "100%" }}
      >
        <Stack align="center" spacing={0} style={{ flexGrow: "1" }}>
          <NoSsr>
            <SearchResults
              searchQuery={router.query.query}
              productsPageLoading={requestedProducts.loading}
              searchedProducts={searchedProducts}
              pageNumber={requestedProducts.pagination.page}
              totalPages={requestedProducts.pagination.totalPages}
              searchedProductsMetaData={searchedProductMetadata}
              averageScrapingTime={averageScrapingTime}
              loadingNew={loadingNew}
            />
          </NoSsr>
        </Stack>
        {!(!requestedProducts.loading && !searchedProducts) && (
          <NoSsr>
            <BasketPreview />
          </NoSsr>
        )}
      </Flex>
    </>
  );
}
