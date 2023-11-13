"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useState, useEffect } from "react";
// External Styling
import { useForm } from "@mantine/form";
import {
  Loader,
  Grid,
  Paper,
  Text,
  Group,
  Container,
  Stack,
  TextInput,
  Button,
  Pagination,
  Skeleton,
  Flex,
  Box,
  Space,
  Title,
  Tabs,
  Badge,
  ActionIcon,
} from "@mantine/core";
import {
  IconArrowBadgeRight,
  IconShoppingBagPlus,
  IconSearch,
  IconShoppingCart,
} from "@tabler/icons-react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
// Intenral: Utils
import { Product, SearchMetaData } from "@/utils/types";
// Intenral: Components
import renderTime from "@/Components/RenderTimeNumber";

interface SearchResultsProps {
  searchText?: string;
  products?: Product[] | undefined;
  searchMetaData: SearchMetaData;
  averageScrapingTime: number | null;
}

type LoadingStates = {
  loading: boolean;
  loadingNew: boolean;
  loadingCached: boolean;
};

export default function SearchResults({
  searchText,
  products,
  searchMetaData,
  averageScrapingTime,
}: SearchResultsProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query");

  // Combined state declaration
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    loading: false,
    loadingNew: false,
    loadingCached: false,
  });

  // Function to update a specific loading state
  const setLoadingState = (stateName: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prevStates) => ({
      ...prevStates,
      [stateName]: value,
    }));
  };

  const [currentAverageScrapingTime, setCurrentAverageScrapingTime] = useState<
    number | null
  >(averageScrapingTime || null);
  const [currentProducts, setCurrentProducts] = useState<Product[] | null>(
    products || null
  );
  const [pages, setPages] = useState<{
    activePage: number | undefined;
    totalPages: number | undefined;
  }>({
    activePage: searchMetaData?.currentPage || undefined,
    totalPages: searchMetaData?.totalPages || undefined,
  });

  useEffect(() => {
    if (products) setCurrentProducts(products);
    if (averageScrapingTime) setCurrentAverageScrapingTime(averageScrapingTime);
    if (searchMetaData.currentPage !== 0 && searchMetaData.totalPages !== 0)
      setPages({
        activePage: searchMetaData.currentPage,
        totalPages: searchMetaData.totalPages,
      });
  }, [averageScrapingTime, products, searchMetaData]);

  useEffect(() => {
    console.log("AVERAGE SCRAPING TIME: ", averageScrapingTime);
    if (currentAverageScrapingTime) {
      setLoadingState("loadingNew", true);

      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: form.values.query,
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
          setLoadingState("loading", false);
          setLoadingState("loadingNew", false);
        } else {
          // TODO: Throw an error?
        }
        socket.close();
      };

      socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      // Cleanup the socket connection on component unmount
      return () => {
        socket.close();
      };
    }
  }, [currentAverageScrapingTime]);

  const form = useForm({
    initialValues: {
      query: searchText || "",
      page: 1,
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  const handleFormSubmit = (values: { query: string; page: number }) => {
    router.push(`?query=${values.query}&page=${values.page}`);

    setLoadingState("loading", true);
  };

  const handlePageChange = (page: number) => {
    setPages((prev) => ({ ...prev, activePage: page }));

    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    setLoadingState("loading", true);
    setLoadingState("loadingCached", true);

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?query=${queryParam}&page=${page}`);
    }, 500); // Adjust this time based on your scrolling speed
  };

  useEffect(() => {
    if (!currentAverageScrapingTime && currentProducts) {
      setLoadingState("loading", false);
      setLoadingState("loadingCached", false);
      setLoadingState("loadingNew", false);
    }
  }, [currentProducts, currentAverageScrapingTime]);

  return (
    <Tabs defaultValue="search">
      <Title align="left" mb="sm">
        Explore
      </Title>
      <Text c="dimmed" mb="md">
        Search for products, add to basket, and make your choices
      </Text>
      <Tabs.List>
        <Tabs.Tab value="search" icon={<IconSearch size="1.2rem" />}>
          Search
        </Tabs.Tab>
        <Tabs.Tab
          value="basket"
          icon={<IconShoppingCart size="1.2rem" />}
          rightSection={
            <Badge
              w={21}
              h={21}
              sx={{ pointerEvents: "none" }}
              variant="filled"
              size="xs"
              p={0}
            >
              12
            </Badge>
          }
        >
          Basket
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="search" pt="xs">
        <Stack align="center">
          <form onSubmit={form.onSubmit(handleFormSubmit)}>
            <Flex
              my="md"
              gap="xs"
              justify="center"
              align="flex-start"
              direction="row"
              wrap="nowrap"
            >
              <TextInput
                id="1"
                withAsterisk
                placeholder="Type a product name"
                disabled={loadingStates.loading}
                radius="lg"
                {...form.getInputProps("query")}
              />
              <ActionIcon
                type="submit"
                variant="filled"
                radius="lg"
                size="lg"
                color="cyan"
                loading={loadingStates.loading}
              >
                <IconSearch size="1.3rem" />
              </ActionIcon>
            </Flex>
          </form>
          {loadingStates.loading &&
          loadingStates.loadingNew &&
          !loadingStates.loadingCached ? (
            <Paper shadow="md" radius="md" p="md">
              <Stack mt={20} mb={5} align="center">
                <Title align="center" w={300}>
                  {" "}
                  Searching supermarkets...
                </Title>
                {currentAverageScrapingTime && (
                  <Text align="center" color="dimmed" w={300}>
                    Hang tight! We're checking supermarkets for up-to-date
                    product data. So far, this has taken us{" "}
                    {Math.ceil(currentAverageScrapingTime) + 10} seconds on
                    average.
                  </Text>
                )}

                {currentAverageScrapingTime && (
                  <CountdownCircleTimer
                    isPlaying={
                      loadingStates.loading &&
                      loadingStates.loadingNew &&
                      !loadingStates.loadingCached
                    }
                    duration={Math.ceil(currentAverageScrapingTime) + 5}
                    colors={["#0C8599", "#15AABF", "#0CA678", "#37B24D"]}
                    colorsTime={[10, 7, 4, 0]}
                    strokeWidth={20}
                  >
                    {renderTime}
                  </CountdownCircleTimer>
                )}
              </Stack>
            </Paper>
          ) : loadingStates.loading &&
            !loadingStates.loadingNew &&
            loadingStates.loadingCached ? (
            <Grid gutter="md" justify="center">
              {Array.from({ length: 24 }).map((_, index) => (
                <Grid.Col key={index} span={12} md={6} xl={4}>
                  <Paper
                    h="190px"
                    shadow="md"
                    withBorder
                    p="sm"
                    m="xs"
                    radius="md"
                  >
                    <Flex
                      gap="md"
                      justify="flex-start"
                      align="flex-start"
                      direction="row"
                      wrap="nowrap"
                    >
                      <Stack align="center">
                        <Skeleton height={80} width={80} />
                        <Skeleton height={60} width={60} />
                      </Stack>

                      <Stack
                        style={{
                          width: "80%",
                        }}
                      >
                        <Skeleton height={8} width={200} />
                        <Skeleton height={8} width={160} />
                        <Skeleton height={8} width={100} />
                        <Space h={35} />
                        <Group position="apart">
                          <Skeleton height={25} width={35} />
                          <Skeleton height={30} width={80} radius="lg" />
                        </Group>
                      </Stack>
                    </Flex>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            currentProducts &&
            currentProducts.length > 0 && (
              <Stack align="center" spacing={0}>
                <Grid gutter={0} justify="center">
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
                                src={product.imgSrc}
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
                                src={`/brand-logos/${product.shopName}.jpeg`}
                                alt={product.shopName}
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
                                {product.shopName.charAt(0).toUpperCase() +
                                  product.shopName.slice(1).toLowerCase()}
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
                                    product.productUrl ? product.productUrl : ""
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
                              <Button
                                variant="light"
                                radius="xl"
                                size="xs"
                                leftIcon={<IconShoppingBagPlus />}
                              >
                                Add
                              </Button>
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

          {queryParam &&
            !loadingStates.loading &&
            currentProducts &&
            currentProducts.length === 0 && (
              <>Sorry, there was nothing found!</>
            )}
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="basket" pt="xs">
        Messages tab content
      </Tabs.Panel>
    </Tabs>
  );
}
