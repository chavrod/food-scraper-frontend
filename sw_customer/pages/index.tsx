import { PropsWithChildren, useState, useEffect } from "react";
import {
  IconArrowBadgeRight,
  IconShoppingBagPlus,
  IconCheck,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import normalizeUrl from "normalize-url";
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
  Image,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  CachedProductsPage,
  CachedProductsPageMetadata,
  ScrapeStatsForCustomer,
  Product,
} from "@/types/customer_types";
import { useSession } from "next-auth/react";
import { useGlobalContext } from "@/Context/globalContext";
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import BasketPreview from "@/Components/BasketPreview";
import SearchHeader from "@/Components/SearchHeader";
import CountdownCircle from "@/Components/CountdownCircle";
import { ProductGridSkeleton } from "@/Components/Skeletons";
import useApi from "@/utils/useApi";
import productsPagesApi from "@/utils/productsPagesApi";
import notifyError from "@/utils/notifyError";

export interface SearchParams {
  query: string;
  page: string;
  // is_relevant_only: boolean;
}

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

type ProductStateType = {
  loading: Record<number, boolean>;
  added: Record<number, boolean>;
};

export default function HomePage() {
  const { data: session } = useSession();
  const { basketItems, isLargerThanSm } = useGlobalContext();

  const router = useRouter();

  // TODO: MAKE IT WORK WITH PARAMS TOO
  let params: SearchParams = {
    query: router.query.query?.toString() || "",
    page: router.query.page?.toString() || "1",
  };

  const productsPage = useApi<
    | [CachedProductsPage, CachedProductsPageMetadata]
    | [{}, ScrapeStatsForCustomer]
  >({
    apiFunc: productsPagesApi.get,
    onSuccess: () => {},
  });
  const [loadingNew, setLoadingNew] = useState(false);

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

  const handleFormSubmit = (values: { query: string; page: number }) => {
    router.push(`?query=${values.query}&page=${values.page}`);
    productsPage.request({ query: values.query, page: 1 });
  };

  console.log(cachedProductsPageMetadata);

  const [pages, setPages] = useState<{
    activePage: number | undefined;
    totalPages: number | undefined;
  }>({
    activePage: undefined,
    totalPages: undefined,
  });

  useEffect(() => {
    setPages({
      activePage: cachedProductsPage?.page || undefined,
      totalPages: cachedProductsPageMetadata?.total_pages || undefined,
    });
  }, [cachedProductsPage, cachedProductsPageMetadata]);

  const handlePageChange = (page: number) => {
    setPages((prev) => ({ ...prev, activePage: page }));

    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?query=${params.query}&page=${page}`);
      productsPage.request({ query: params.query, page: page });
    }, 500); // Adjust this time based on your scrolling speed
  };

  useEffect(() => {
    if (averageScrapingTime && params.query) {
      setLoadingNew(true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: params.query,
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

  const suggestedSearchOptions = [
    { name: "Cheese", imgPath: "cheese.png" },
    { name: "Avocado", imgPath: "avocado.png" },
    { name: "Beef", imgPath: "beef.png" },
    { name: "Chicken", imgPath: "chicken.png" },
  ];

  interface SuggestedSearchOptionCardProps extends PropsWithChildren {
    query: string;
  }

  const SuggestedSearchOptionCard = ({
    query,
    ...props
  }: SuggestedSearchOptionCardProps) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePress = () => {
      setIsPressed(true);
    };

    const handleRelease = ({ send }: { send: boolean }) => {
      setIsPressed(false);
      send && handleFormSubmit({ query: query, page: 1 });
    };

    return (
      <Paper
        className={`touchable-card ${isPressed ? "pressed" : ""}`}
        h={isLargerThanSm ? 240 : 160}
        w={isLargerThanSm ? 240 : 160}
        shadow="lg"
        withBorder
        p={isLargerThanSm ? "lg" : "sm"}
        radius="lg"
        onTouchStart={handlePress}
        onMouseDown={handlePress}
        onTouchEnd={() => handleRelease({ send: true })}
        onMouseUp={() => handleRelease({ send: true })}
        onMouseLeave={() => handleRelease({ send: false })}
        style={{ cursor: "pointer" }}
      >
        {props.children}
      </Paper>
    );
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
          searchText={params.query}
          handleSubmit={handleFormSubmit}
          loadingSearch={productsPage.loading}
          isLargerThanSm={isLargerThanSm}
        />
        {!params.query && !productsPage.loading && !cachedProductsPage ? (
          <Stack mx="lg" align="left" spacing={0}>
            <Title order={2} mb="md">
              Suggested Searches
            </Title>
            <Grid>
              {suggestedSearchOptions.map((option, index) => (
                <Grid.Col key={index} span={6} xl={3}>
                  <SuggestedSearchOptionCard query={option.name}>
                    <Stack align="center" spacing={0}>
                      <Image
                        src={option.imgPath}
                        alt={option.name}
                        width={isLargerThanSm ? 150 : 90}
                      />
                      <Text weight={500} fz="xl">
                        {option.name}
                      </Text>
                    </Stack>
                  </SuggestedSearchOptionCard>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        ) : loadingNew && averageScrapingTime ? (
          <CountdownCircle
            currentAverageScrapingTime={averageScrapingTime}
            loading={loadingNew}
          />
        ) : productsPage.loading ? (
          <ProductGridSkeleton />
        ) : (
          cachedProductsPage?.results &&
          cachedProductsPage.results.length > 0 && (
            <Stack align="center" spacing={0}>
              <Group px="lg" align="left" style={{ width: "100%" }}>
                {params.query && (
                  <Title order={isLargerThanSm ? 1 : 3}>
                    Results for "{params.query}"
                  </Title>
                )}
              </Group>
              <Grid gutter={0} justify="center" m="sm">
                {cachedProductsPage.results.map((product, index) => (
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

        {params.query &&
          !productsPage.loading &&
          !loadingNew &&
          cachedProductsPage?.results &&
          cachedProductsPage.results.length === 0 && (
            <>Sorry, there was nothing found!</>
          )}
      </Stack>
      {isLargerThanSm && <BasketPreview />}
    </Flex>
  );
}
