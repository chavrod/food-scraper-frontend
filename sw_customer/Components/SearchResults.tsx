import React, { useState } from "react";
import {
  IconShoppingBagPlus,
  IconCheck,
  IconTelescope,
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
  Select,
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import {
  SearchedProduct,
  SearchedProductMetadata,
  BasketProduct,
} from "@/types/customer_types";
import { useSessionContext } from "@/Context/SessionContext";
import { useGlobalContext } from "@/Context/globalContext";
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import CountdownCircle from "@/Components/CountdownCircle";
import { ProductGridSkeleton } from "@/Components/Skeletons";
import SearchIntro from "./SearchIntro";
import FilterDrawer from "./FilterDrawer";

type ProductStateType = {
  loading: Record<number, boolean>;
  added: Record<number, boolean>;
};

interface SearchResultsProps {
  searchQuery: string | undefined;
  productsPageLoading: boolean;
  searchedProducts: SearchedProduct[] | undefined;
  pageNumber: number;
  totalPages: number;
  averageScrapingTime: any;
  loadingNew: boolean;
  searchedProductsMetaData: SearchedProductMetadata | undefined;
}

function SearchResults({
  searchQuery,
  productsPageLoading,
  searchedProducts,
  pageNumber,
  totalPages,
  averageScrapingTime,
  loadingNew,
  searchedProductsMetaData,
}: SearchResultsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const { session } = useSessionContext();
  const accessToken = session?.access_token;

  const { basketItems } = useGlobalContext();
  const isLargerThanSm = useMediaQuery("(min-width: 768px)", undefined, {
    getInitialValueInEffect: false,
  });

  const router = useRouter();

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Wait for the scroll to complete
    setTimeout(() => {
      router.push(
        {
          ...router,
          query: {
            ...router.query,
            page,
          },
        },
        undefined,
        { shallow: true }
      );
    }, 500);
  };

  const { handleSubmit } = useApiSubmit({
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

  const handleAddToBasket = async (product: BasketProduct, index: number) => {
    setProductStates((prevStates) => ({
      ...prevStates,
      loading: { ...prevStates.loading, [index]: true },
    }));

    // Encode the URL - some urls are non standard
    const modifiedProduct = {
      ...product,
      img_src: product.img_src
        ? normalizeUrl(product.img_src)
        : product.img_src,
    };

    const wasSuccessful = await handleSubmit(modifiedProduct, {
      title: "Added item",
      body: `${modifiedProduct.name} added to basket.`,
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

  const orderOptions = [
    { value: "price", label: "Price Low to High" },
    { value: "-price", label: "Price High to Low" },
    { value: "value", label: "Value Low to High" },
    { value: "-value", label: "Value High to Low" },
  ];

  const handleFilter = (order_option: string) => {
    router.push(
      {
        ...router,
        query: {
          ...router.query,
          page: 1,
          order_by: order_option,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <>
      {searchedProductsMetaData && (
        <FilterDrawer
          opened={opened}
          close={close}
          searchedProductsMetaData={searchedProductsMetaData}
        />
      )}

      {!searchQuery && !productsPageLoading && !searchedProducts ? (
        <SearchIntro />
      ) : loadingNew && averageScrapingTime ? (
        <CountdownCircle
          currentAverageScrapingTime={averageScrapingTime}
          loading={loadingNew}
        />
      ) : productsPageLoading ? (
        <ProductGridSkeleton />
      ) : (
        searchedProducts &&
        searchedProducts.length > 0 && (
          <Stack align="center" spacing={0}>
            <Group px="lg" position="apart" mt="md" style={{ width: "100%" }}>
              {searchQuery && searchedProductsMetaData?.total_results && (
                <Title order={isLargerThanSm ? 1 : 3}>
                  {searchedProductsMetaData.total_results} results for &apos;
                  {searchQuery}
                  &apos;
                </Title>
              )}
              <Group>
                <Select
                  value={searchedProductsMetaData?.order_by ?? "price"}
                  onChange={handleFilter}
                  placeholder="Pick one"
                  data={orderOptions}
                />
                <Group position="center">
                  <Button onClick={open} variant="outline" radius="xs">
                    {searchedProductsMetaData &&
                    searchedProductsMetaData.filter_count > 0
                      ? `${searchedProductsMetaData.filter_count} Filter${
                          searchedProductsMetaData.filter_count > 1 ? "s" : ""
                        }`
                      : "Filters"}
                  </Button>
                </Group>
              </Group>
            </Group>
            <Grid gutter={0} justify="center" m="sm" grow>
              {searchedProducts.map((product, index) => (
                // eslint-disable-next-line react/no-array-index-key
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
                            loading="lazy"
                            decoding="async"
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
                        <Group spacing={0} h={40} position="apart" noWrap>
                          <Group noWrap spacing={2}>
                            <Text size="lg" align="center">
                              {product.price
                                ? `€${product.price.toFixed(2)}`
                                : "Price not available"}
                            </Text>
                            <Text size="sm" color="dimmed" align="center">
                              {`€${product.price_per_unit.toFixed(2)}/${
                                product.unit_type
                              }`}
                            </Text>
                          </Group>

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
                                if (session) {
                                  handleAddToBasket(product, index);
                                }
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
        searchedProducts &&
        searchedProducts.length === 0 && (
          <Stack
            align="center"
            justify="center"
            style={{ height: "calc(100vh - 130px)" }}
          >
            <IconTelescope size="5rem" />
            <Text size="lg" fw={500}>
              Sorry, there was nothing found!
            </Text>
            <Button onClick={open}>Adjust filters</Button>
          </Stack>
        )}
    </>
  );
}

export default React.memo(SearchResults);
