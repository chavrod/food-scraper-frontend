import Head from "next/head";
import { useState, useEffect } from "react";
import { IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Stack, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  CachedProductsPage,
  CachedProductsPageMetadata,
  ScrapeStatsForCustomer,
} from "@/types/customer_types";
import BasketPreview from "@/Components/BasketPreview";
import SearchHeader from "@/Components/SearchHeader";
import { useSessionContext } from "@/Context/SessionContext";
import usePaginatedApi from "@/utils/usePaginatedApi";
import productsPagesApi from "@/utils/productsPagesApi";
import notifyError from "@/utils/notifyError";
import SearchResults from "@/Components/SearchResults";
import NoSsr from "@/utils/NoSsr";

export interface SearchParams {
  query: string;
  page: string;
}

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

export default function HomePage() {
  const router = useRouter();

  const { session, isLoading } = useSessionContext();
  const accessToken = session?.access_token;

  const productsPage = usePaginatedApi<
    | [CachedProductsPage, CachedProductsPageMetadata]
    | [{}, ScrapeStatsForCustomer]
  >({
    apiFunc: productsPagesApi.get,
    onSuccess: () => {},
    accessToken,
  });
  const [loadingNew, setLoadingNew] = useState(false);

  const searchQuery = router.query.query?.toString().toLowerCase() || "";
  const searchPage = router.query.page?.toString() || "1";
  useEffect(() => {
    if (searchQuery) {
      productsPage.request({ query: searchQuery, page: searchPage });
    }
  }, [searchQuery, searchPage]);

  const averageScrapingTime =
    productsPage?.responseData?.metaData &&
    "average_time_seconds" in productsPage?.responseData?.metaData
      ? productsPage?.responseData?.metaData.average_time_seconds
      : undefined;

  const cachedProductsPage = !averageScrapingTime
    ? (productsPage?.responseData?.data as CachedProductsPage | undefined)
    : undefined;

  const cachedProductsPageMetadata = !averageScrapingTime
    ? (productsPage?.responseData?.metaData as
        | CachedProductsPageMetadata
        | undefined)
    : undefined;

  useEffect(() => {
    if (averageScrapingTime && searchQuery) {
      setLoadingNew(true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: searchQuery,
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
            productsPage.request({ query: responseData.query, page: 1 });
          }, 1000);
        } else {
          notifyError(
            "Sorry, we were not able to get any results from your request."
          );
        }
        socket.close();
      };

      socket.onerror = (error) => {
        notifyError("An error has occured.");
        console.error("WebSocket Error:", error);
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
        justify="space-between" // Spaces children divs apart
        align="flex-start" // Aligns children divs at the top
        direction="row"
        wrap="nowrap"
        style={{ width: "100%" }}
      >
        <Stack align="center" spacing={0} style={{ flexGrow: "1" }}>
          <NoSsr>
            <SearchResults
              searchQuery={searchQuery}
              productsPageLoading={productsPage.loading}
              cachedProductsPage={cachedProductsPage}
              pageNumber={productsPage.pagination.page}
              totalPages={productsPage.pagination.totalPages}
              cachedProductsPageMetadata={cachedProductsPageMetadata}
              averageScrapingTime={averageScrapingTime}
              loadingNew={loadingNew}
            />
          </NoSsr>
        </Stack>
        <NoSsr>
          <BasketPreview />
        </NoSsr>
      </Flex>
    </>
  );
}
