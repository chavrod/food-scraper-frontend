import { useState, useEffect } from "react";
import { IconCheck } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { Stack, Flex } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import BasketPreview from "@/Components/BasketPreview";
import notifyError from "@/utils/notifyError";
import SearchResults from "@/Components/SearchResults";
import NoSsr from "@/utils/NoSsr";
import { useGlobalContext } from "@/Context/globalContext";

export interface SearchParams {
  query: string;
  page: string;
  order: string;
}

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

export default function HomePage() {
  const router = useRouter();

  const {
    requestedProducts,
    averageScrapingTime,
    searchedProducts,
    searchedProductMetadata,
  } = useGlobalContext();

  const [loadingNew, setLoadingNew] = useState(false);

  // TODO: Think of a better solution (that handles 5+ params neatly)
  const searchQuery = router.query.query?.toString().toLowerCase() || "";
  const searchPage = router.query.page?.toString() || "1";
  const searchOrder = router.query.order_by?.toString() || "price";
  const priceRange = router.query.price_range?.toString() || "";
  const unitType = router.query.unit_type?.toString() || "";
  const unitMeasurmentRange =
    router.query.unit_measurement_range?.toString() || "";
  // TODO: Things like price__range should not even be included
  // if they are not provided
  useEffect(() => {
    if (searchQuery) {
      requestedProducts.request({
        query: searchQuery,
        page: searchPage,
        order_by: searchOrder,
        price_range: priceRange,
        unit_type: unitType,
        unit_measurement_range: unitMeasurmentRange,
      });
    }
  }, [
    searchQuery,
    searchPage,
    searchOrder,
    priceRange,
    unitType,
    unitMeasurmentRange,
  ]);

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

        console.log("responseData: ", responseData);

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
              searchQuery={searchQuery}
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
