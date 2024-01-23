"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useState, useEffect, useId } from "react";
import { useSession } from "next-auth/react";
import normalizeUrl from "normalize-url";
// External Styling
import {
  Grid,
  Paper,
  Text,
  Group,
  Container,
  Stack,
  Button,
  Pagination,
  Flex,
  Box,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBadgeRight,
  IconShoppingBagPlus,
  IconCheck,
} from "@tabler/icons-react";
// Intenral: Utils
import {
  Product,
  CachedProductsPage,
  CachedProductsPageResult,
} from "@/types/customer_types";
// Intenral: Components
import BasketPreview from "./BasketPreview";
import SearchHeader from "./SearchHeader";
import CountdownCircle from "./CountdownCircle";
import { ProductGridSkeleton } from "./Skeletons";
// Intenral: API
import basketItemsApi from "@/app/api/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import { useGlobalContext } from "@/Context/globalContext";
import notifyError from "@/utils/notifyError";

interface SearchResultsProps {
  searchText: string | undefined;
  cachedProductsPage: CachedProductsPage | undefined;
  averageScrapingTime: number | undefined;
  errorMessage: string | undefined;
}

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

type ProductStateType = {
  loading: Record<number, boolean>;
  added: Record<number, boolean>;
};

export default function SearchResults({
  searchText,
  cachedProductsPage,
  averageScrapingTime,
  errorMessage,
}: SearchResultsProps): ReactElement {
  const { data: session } = useSession();

  const router = useRouter();

  const { basketItems, isLargerThanSm } = useGlobalContext();

  // Combined state declaration
  const [loadingStates, setLoadingStates] = useState<ItemsLoadingStates>({
    loadingNew: false,
    loadingCached: false,
  });

  // Function to update a specific loading state
  const setLoadingState = (
    stateName: keyof ItemsLoadingStates,
    value: boolean
  ) => {
    setLoadingStates((prevStates) => ({
      ...prevStates,
      [stateName]: value,
    }));
  };

  const [currentAverageScrapingTime, setCurrentAverageScrapingTime] = useState<
    number | null
  >(averageScrapingTime || null);

  const [currentProducts, setCurrentProducts] = useState<
    CachedProductsPageResult[] | null
  >(cachedProductsPage?.results || null);

  const [pages, setPages] = useState<{
    activePage: number | undefined;
    totalPages: number | undefined;
  }>({
    activePage: cachedProductsPage?.page || undefined,
    totalPages: cachedProductsPage?.total_pages || undefined,
  });

  useEffect(() => {
    if (errorMessage) {
      setLoadingState("loadingCached", false);
      setLoadingState("loadingNew", false);
      notifyError(errorMessage);
      return;
    }
    if (cachedProductsPage?.results)
      setCurrentProducts(cachedProductsPage?.results);
    if (averageScrapingTime) setCurrentAverageScrapingTime(averageScrapingTime);
    if (
      cachedProductsPage &&
      cachedProductsPage?.page !== 0 &&
      cachedProductsPage?.total_pages !== 0
    )
      setPages({
        activePage: cachedProductsPage.page,
        totalPages: cachedProductsPage.total_pages,
      });
  }, [averageScrapingTime, cachedProductsPage, errorMessage]);

  useEffect(() => {
    console.log("AVERAGE SCRAPING TIME: ", averageScrapingTime);
    if (currentAverageScrapingTime && searchText) {
      setLoadingState("loadingNew", true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: searchText,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        console.log("MESSAGE RECEIVED");
        const responseData = JSON.parse(event.data);

        if (responseData.results) {
          setCurrentProducts(responseData.results);
          setCurrentAverageScrapingTime(null);
          setPages({
            activePage: 1,
            totalPages: responseData.total_pages,
          });
          setLoadingState("loadingNew", false);
        } else {
          // TODO: Throw an error?
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
  }, [currentAverageScrapingTime]);

  const handleFormSubmit = (values: { query: string; page: number }) => {
    router.push(`?query=${values.query}&page=${values.page}`);

    setLoadingState("loadingCached", true);
    setLoadingState("loadingNew", true);
  };

  const handlePageChange = (page: number) => {
    setPages((prev) => ({ ...prev, activePage: page }));

    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    setLoadingState("loadingCached", true);

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?query=${searchText}&page=${page}`);
    }, 500); // Adjust this time based on your scrolling speed
  };

  useEffect(() => {
    if (!currentAverageScrapingTime && currentProducts) {
      setLoadingState("loadingCached", false);
      setLoadingState("loadingNew", false);
    }
  }, [currentProducts, currentAverageScrapingTime]);

  const { handleSubmit, loading: loadingSubmit } = useApiSubmit({
    apiFunc: basketItemsApi.addItemQuantity,

    onSuccess: () => {
      basketItems.request();
    },
  });

  const [productStates, setProductStates] = useState<ProductStateType>({
    loading: {},
    added: {},
  });

  const handleAddToBasket = async (product: Product, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loading: { ...prevStates.loading, [index]: true },
    }));

    // Encode the URL - some urls are non standard
    if (product.img_src) {
      product.img_src = normalizeUrl(product.img_src);
    }

    const wasSuccessful = await handleSubmit(
      product,
      `Added ${product.name} to basket.`
    );
    // Update states based on whether adding to basket was successful
    if (wasSuccessful) {
      setProductStates((prevStates) => ({
        loading: { ...prevStates.loading, [index]: false },
        added: { ...prevStates.added, [index]: true },
      }));

      setTimeout(() => {
        setProductStates((prevStates) => ({
          ...prevStates,
          added: { ...prevStates.added, [index]: false },
        }));
      }, 2000);
    } else {
      setProductStates((prevStates) => ({
        ...prevStates,
        loading: { ...prevStates.loading, [index]: false },
      }));
    }
  };

  return (
    <Flex
      justify="space-between" // Spaces children divs apart
      align="flex-start" // Aligns children divs at the top
      direction="row"
      wrap="nowrap"
      style={{ width: "100%" }}
    >
      {/* Main Content Area */}
      <Stack align="center" spacing={0} style={{ flexGrow: "1" }}>
        <SearchHeader
          searchText={searchText}
          handleSubmit={handleFormSubmit}
          loadingSearch={
            loadingStates.loadingNew || loadingStates.loadingCached
          }
        />
        {loadingStates.loadingNew && !loadingStates.loadingCached ? (
          <CountdownCircle
            currentAverageScrapingTime={currentAverageScrapingTime}
            loadingStates={loadingStates}
          />
        ) : !loadingStates.loadingNew && loadingStates.loadingCached ? (
          <ProductGridSkeleton />
        ) : (
          currentProducts &&
          currentProducts.length > 0 && (
            <Stack align="center" spacing={0}>
              <Group px="lg" align="left" style={{ width: "100%" }}>
                {searchText && (
                  <Title order={isLargerThanSm ? 1 : 3}>
                    Results for "{searchText}"
                  </Title>
                )}
              </Group>
              <Grid gutter={0} justify="center" m="sm">
                {currentProducts.map((product, index) => (
                  <Grid.Col key={index} span={12} md={6} xl={4}>
                    <Paper
                      h="190px"
                      shadow="md"
                      withBorder
                      p="sm"
                      m="xs"
                      radius="md"
                    >
                      <Group noWrap>
                        <Stack align="center" spacing={0}>
                          <Container
                            w={100}
                            h={100}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <img
                              src={product.img_src || "no-product-image.jpeg"}
                              alt={product.name}
                              style={{ width: "5rem" }}
                            />
                          </Container>
                          <Container
                            w={100}
                            h={60}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <img
                              src={`/brand-logos/${product.shop_name}.jpeg`}
                              alt={product.shop_name}
                              style={{ width: "3rem" }}
                            />
                          </Container>
                        </Stack>

                        <Stack
                          style={{
                            width: "100%",
                          }}
                          justify="space-between"
                        >
                          <Box h={100}>
                            <Text size={15} align="left" lineClamp={2}>
                              {product.name}
                            </Text>
                            <Text fz="sm" c="dimmed">
                              {product.shop_name.charAt(0).toUpperCase() +
                                product.shop_name.slice(1).toLowerCase()}
                            </Text>
                            <Group spacing={0} align="center">
                              <Text
                                fz="md"
                                c="cyan.7"
                                sx={{
                                  cursor: "pointer",
                                  "&:hover": {
                                    textDecoration: "underline",
                                  },
                                }}
                                fw={700}
                                component="a"
                                href={
                                  product.product_url ? product.product_url : ""
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Go to source
                              </Text>
                              <IconArrowBadgeRight
                                size={20}
                                style={{ color: "#1098AD" }}
                              />
                            </Group>
                          </Box>

                          <Group spacing={0} h={40} position="apart">
                            <Text align="center">
                              {product.price
                                ? `€${product.price.toFixed(2)}`
                                : "Price not available"}
                            </Text>
                            <Tooltip
                              label="Log in to Add"
                              disabled={!!session}
                              events={{
                                hover: true,
                                focus: false,
                                touch: true,
                              }}
                            >
                              <Button
                                loading={productStates.loading[index]}
                                variant="light"
                                radius="xl"
                                size="xs"
                                leftIcon={
                                  productStates.added[index] ? (
                                    <IconCheck />
                                  ) : (
                                    <IconShoppingBagPlus />
                                  )
                                }
                                color={
                                  session
                                    ? productStates.added[index]
                                      ? "teal"
                                      : "default"
                                    : "gray.6"
                                }
                                onClick={() => {
                                  session && handleAddToBasket(product, index);
                                }}
                              >
                                {productStates.added[index] ? "Added!" : "Add"}
                              </Button>
                            </Tooltip>
                          </Group>
                        </Stack>
                      </Group>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
              {pages.totalPages && pages.totalPages > 0 ? (
                <Pagination
                  mb={30}
                  py="xl"
                  spacing={5}
                  value={pages.activePage}
                  onChange={(p) => handlePageChange(p)}
                  total={pages.totalPages}
                />
              ) : null}
            </Stack>
          )
        )}

        {searchText &&
          !loadingStates.loadingNew &&
          !loadingStates.loadingCached &&
          currentProducts &&
          currentProducts.length === 0 && <>Sorry, there was nothing found!</>}
      </Stack>
      {isLargerThanSm && <BasketPreview />}
    </Flex>
  );
}
