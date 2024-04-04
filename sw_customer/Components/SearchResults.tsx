import React, { PropsWithChildren, useState } from "react";
import { IconShoppingBagPlus, IconCheck } from "@tabler/icons-react";
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
  Drawer,
  RangeSlider,
  Slider,
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import { SearchedProduct, BasketProduct } from "@/types/customer_types";
import { useSessionContext } from "@/Context/SessionContext";
import { useGlobalContext } from "@/Context/globalContext";
import basketItemsApi from "@/utils/basketItemsApi";
import useApiSubmit from "@/utils/useApiSubmit";
import CountdownCircle from "@/Components/CountdownCircle";
import { ProductGridSkeleton } from "@/Components/Skeletons";
import SearchIntro from "./SearchIntro";
import { otherMetaData } from "@/utils/usePaginatedApi";

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
  searchedProducts: SearchedProduct[] | undefined;
  pageNumber: number;
  totalPages: number;
  averageScrapingTime: any;
  loadingNew: boolean;
  otherMetaData: otherMetaData;
}

// export default React.memo(SearchResults);

export default React.memo(function SearchResults({
  searchQuery,
  productsPageLoading,
  searchedProducts,
  pageNumber,
  totalPages,
  averageScrapingTime,
  loadingNew,
  otherMetaData,
}: SearchResultsProps) {
  const [opened, { open, close }] = useDisclosure(false);

  const { session, isLoading } = useSessionContext();
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
        `?query=${searchQuery}&page=${page}&order_by=${otherMetaData.orderBy}`
      );
    }, 500);
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

  const handleAddToBasket = async (product: BasketProduct, index: number) => {
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

  const orderOptions = [
    { value: "price", label: "Price Low to High" },
    { value: "-price", label: "Price High to Low" },
    { value: "value", label: "Value Low to High" },
    { value: "-value", label: "Value High to Low" },
  ];

  const handleFilter = (order_option: string) => {
    router.push(`?query=${searchQuery}&page=${1}&order_by=${order_option}`);
  };

  return (
    <>
      <FilterDrawer opened={opened} close={close} />
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
              {searchQuery && (
                <Title order={isLargerThanSm ? 1 : 3}>
                  {otherMetaData.totalResults} results for &apos;{searchQuery}
                  &apos;
                </Title>
              )}
              <Group>
                <Select
                  value={otherMetaData.orderBy || "price"}
                  onChange={handleFilter}
                  // label="Selected shops"
                  placeholder="Pick one"
                  data={orderOptions}
                />
                <Group position="center">
                  <Button onClick={open}>Filters</Button>
                </Group>
              </Group>
            </Group>
            <Grid gutter={0} justify="center" m="sm">
              {searchedProducts.map((product, index) => (
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
        searchedProducts &&
        searchedProducts.length === 0 && <>Sorry, there was nothing found!</>}
    </>
  );
});

const FilterDrawer = ({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) => {
  return (
    <Drawer opened={opened} onClose={close} position="right">
      {/* TODO: Add Clear all, with divider */}
    </Drawer>
  );
};

type RangeSliderComponentProps = {
  unit: SearchedProduct["unit_type"];
};

function RangeSliderComponent({ unit }: RangeSliderComponentProps) {
  function valueLabelFormat(value: number, unit: string) {
    // Define the scaling and units for KG and L
    const scaleForKgAndL = 100; // Start from 100mg or 100ml
    let scaledValue = value;
    let displayUnit = unit;

    // Handle KG and L units
    if (unit === "KG" || unit === "L") {
      // Convert value to KG or L if it's 1000 or more
      if (value >= 1000) {
        scaledValue = value / 1000; // Convert to KG or L
        displayUnit = unit === "KG" ? "kg" : "litre";
      } else {
        scaledValue = value * scaleForKgAndL; // Keep as mg or ml
        displayUnit = unit === "KG" ? "mg" : "ml";
      }
    } else if (unit === "euros" || unit === "EACH") {
      // For euros and EACH, use the value directly without conversion
      displayUnit = unit;
    } else {
      // Add handling for other units if necessary
    }

    return `${scaledValue} ${displayUnit}`;
  }

  return (
    <Stack spacing="xl" p="xl">
      <RangeSlider
        py="xl"
        scale={(v) => 2 ** v}
        step={1}
        min={2}
        max={30}
        labelAlwaysOn
        defaultValue={[10, 20]}
        label={(value) => valueLabelFormat(value, "L")} // Specify the unit as 'L' here
      />
      {/* Add more sliders for euros and EACH if needed */}
    </Stack>
  );
}
