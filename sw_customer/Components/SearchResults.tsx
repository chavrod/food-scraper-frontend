import React, { PropsWithChildren, useState } from "react";
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
  Box,
  Title,
  Tooltip,
  Image,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  CachedProductsPage,
  CachedProductsPageMetadata,
  Product,
} from "@/types/customer_types";
import { useSessionContext } from "@/Context/SessionContext";
import { useGlobalContext } from "@/Context/globalContext";
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import CountdownCircle from "@/Components/CountdownCircle";
import { ProductGridSkeleton } from "@/Components/Skeletons";
import SearchIntro from "./SearchIntro";

export type ItemsLoadingStates = {
  loadingNew: boolean;
  loadingCached: boolean;
};

type ProductStateType = {
  loading: Record<number, boolean>;
  added: Record<number, boolean>;
};

interface SearchResultsProps {
  searchQuery: string | undefined;
  productsPageLoading: boolean;
  cachedProductsPage: CachedProductsPage | undefined;
  pageNumber: number;
  totalPages: number;
  cachedProductsPageMetadata: CachedProductsPageMetadata | undefined;
  averageScrapingTime: any;
  loadingNew: boolean;
}

// export default React.memo(SearchResults);

export default React.memo(function SearchResults({
  searchQuery,
  productsPageLoading,
  cachedProductsPage,
  pageNumber,
  totalPages,
  cachedProductsPageMetadata,
  averageScrapingTime,
  loadingNew,
}: SearchResultsProps) {
  const { session, isLoading } = useSessionContext();
  const accessToken = session?.access_token;

  const { basketItems } = useGlobalContext();
  const isLargerThanSm = useMediaQuery("(min-width: 768px)", undefined, {
    getInitialValueInEffect: false,
  });

  const router = useRouter();

  const handleFormSubmit = (values: { query: string; page: string }) => {
    router.push(`?query=${values.query}&page=${values.page}`);
  };

  const handlePageChange = (page: number) => {
    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?query=${searchQuery}&page=${page}`);
    }, 500); // Adjust this time based on your scrolling speed
  };

  const { handleSubmit, loading: loadingSubmit } = useApiSubmit({
    apiFunc: basketItemsApi.addItemQuantity,
    onSuccess: () => {
      basketItems.request();
    },
    accessToken,
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

    const wasSuccessful = await handleSubmit(product, {
      title: "Added item",
      body: `${product.name} added to basket.`,
    });
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
      send && handleFormSubmit({ query: query.toLowerCase(), page: "1" });
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
    <>
      {!searchQuery && !productsPageLoading && !cachedProductsPage ? (
        <SearchIntro />
      ) : // <Stack mx="lg" align="left" spacing={0}>
      //   <Title order={2} my="md">
      //     Suggested Searches
      //   </Title>
      //   <Grid>
      //     {suggestedSearchOptions.map((option, index) => (
      //       <Grid.Col key={index} span={6} xl={3}>
      //         <SuggestedSearchOptionCard query={option.name}>
      //           <Stack align="center" spacing={0}>
      //             <Image
      //               src={option.imgPath}
      //               alt={option.name}
      //               width={isLargerThanSm ? 150 : 90}
      //             />
      //             <Text weight={500} fz="xl">
      //               {option.name}
      //             </Text>
      //           </Stack>
      //         </SuggestedSearchOptionCard>
      //       </Grid.Col>
      //     ))}
      //   </Grid>
      // </Stack>

      loadingNew && averageScrapingTime ? (
        <CountdownCircle
          currentAverageScrapingTime={averageScrapingTime}
          loading={loadingNew}
        />
      ) : productsPageLoading ? (
        <ProductGridSkeleton />
      ) : (
        cachedProductsPage?.results &&
        cachedProductsPage.results.length > 0 && (
          <Stack align="center" spacing={0}>
            <Group px="lg" align="left" style={{ width: "100%" }}>
              {searchQuery && (
                <Title order={isLargerThanSm ? 1 : 3} mt="md">
                  Results for &apos;{searchQuery}&apos;
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

                          <Text
                            fz="md"
                            c="brand.7"
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
                            lineClamp={2}
                          >
                            Go to source ❯
                          </Text>
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
            {totalPages > 1 ? (
              <Pagination
                mb={30}
                py="xl"
                spacing={5}
                value={pageNumber}
                onChange={(p) => handlePageChange(p)}
                total={totalPages}
              />
            ) : null}
          </Stack>
        )
      )}

      {searchQuery &&
        !productsPageLoading &&
        !loadingNew &&
        cachedProductsPage?.results &&
        cachedProductsPage.results.length === 0 && (
          <>Sorry, there was nothing found!</>
        )}
    </>
  );
});
