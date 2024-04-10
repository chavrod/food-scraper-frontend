import React, { PropsWithChildren, useState } from "react";
import {
  IconShoppingBagPlus,
  IconCheck,
  IconScale,
  IconDroplet,
  IconHash,
  IconRuler2,
  IconSquareHalf,
  IconBorderStyle,
  IconToiletPaper,
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
  Drawer,
  RangeSlider,
  Flex,
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
  searchedProductsMetaData: SearchedProductMetadata | undefined;
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
  searchedProductsMetaData,
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
        {
          ...router,
          query: {
            ...router.query,
            page: page,
          },
        },
        undefined,
        { shallow: true }
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
                  // label="Selected shops"
                  placeholder="Pick one"
                  data={orderOptions}
                />
                <Group position="center">
                  <Button onClick={open}>Filters</Button>
                </Group>
              </Group>
            </Group>
            <Grid gutter={0} justify="center" m="sm" grow>
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

type FilterOptionCardProps = {
  unit: SearchedProduct["unit_type"];
  count: number;
  onCardClick: (unit: SearchedProduct["unit_type"]) => void;
  isSelected: boolean;
};

const FilterOptionCard = ({
  unit,
  count,
  onCardClick,
  isSelected,
}: FilterOptionCardProps) => {
  const getIconForUnit = (unit: SearchedProduct["unit_type"]) => {
    const size = "1.5rem";
    switch (unit) {
      case "KG":
        return <IconScale size={size} />;
      case "L":
        return <IconDroplet size={size} />;
      case "M":
        return <IconRuler2 size={size} />;
      case "M2":
        return <IconSquareHalf size={size} />;
      case "HUNDRED_SHEETS":
        return <IconToiletPaper size={size} />;
      case "EACH":
        return <IconHash size={size} />;
      default:
        return <IconHash size={size} />;
    }
  };

  const getPrettyUnitName = (unit: SearchedProduct["unit_type"]) => {
    switch (unit) {
      case "KG":
        return "Kilograms";
      case "L":
        return "Litres";
      case "M":
        return "Metres";
      case "M2":
        return "Square metre";
      case "HUNDRED_SHEETS":
        return "100 Sheets";
      case "EACH":
        return "Per Item";
      default:
        return "Per Item";
    }
  };

  return (
    <Paper
      h="100%"
      shadow="lg"
      withBorder
      p="lg"
      radius="lg"
      style={{ cursor: "pointer" }}
      sx={(theme) => ({
        width: "auto",
        cursor: "pointer",
        outline: isSelected ? `2px solid ${theme.colors.brand[5]}` : "none",
        outlineOffset: isSelected ? "-1px" : "0",
      })}
      onClick={() => onCardClick(unit)}
    >
      <Group spacing="md">
        {getIconForUnit(unit)}
        <Stack spacing={0}>
          <Text>{getPrettyUnitName(unit)}</Text>
          <Text c="dimmed" size="sm">
            {count} {count === 1 ? "item" : "items"}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
};

const FilterDrawer = ({
  opened,
  close,
  searchedProductsMetaData,
}: {
  opened: boolean;
  close: () => void;
  searchedProductsMetaData: SearchedProductMetadata;
}) => {
  const router = useRouter();

  const [activeUnit, setActiveUnit] = useState<
    SearchedProduct["unit_type"] | null
  >(searchedProductsMetaData.active_unit);

  type SliderValues = {
    [key in SearchedProduct["unit_type"]]?: [number, number];
  };
  const initialUnitSliderValues: SliderValues = {};
  // Initialize state for each slider
  searchedProductsMetaData.units_range_list.forEach((unit_type_data) => {
    initialUnitSliderValues[unit_type_data.name] = [
      unit_type_data.min_selected ?? unit_type_data.min,
      unit_type_data.max_selected ?? unit_type_data.max,
    ];
  });

  const [unitSliderValues, setUnitSliderValues] = useState<SliderValues>(
    initialUnitSliderValues
  );

  const initialPriceRange: [number, number] = [
    searchedProductsMetaData.price_range_info.min_selected ??
      searchedProductsMetaData.price_range_info.min,
    searchedProductsMetaData.price_range_info.max_selected ??
      searchedProductsMetaData.price_range_info.max,
  ];

  const [priceSliderValues, setPriceSliderValues] =
    useState<[number, number]>(initialPriceRange);

  const handleUnitSliderChange = (
    unit: SearchedProduct["unit_type"],
    values: [number, number]
  ) => {
    setUnitSliderValues((prevValues) => ({
      ...prevValues,
      [unit]: values,
    }));
  };

  const isPriceRangeUpdated =
    JSON.stringify(initialPriceRange) !== JSON.stringify(priceSliderValues);
  const isActiveUnitChanged =
    activeUnit !== searchedProductsMetaData.active_unit;
  const isUnitRangeUpdated = !!(
    activeUnit &&
    JSON.stringify(initialUnitSliderValues[activeUnit]) !==
      JSON.stringify(unitSliderValues[activeUnit])
  );

  const filterRequestDisabled = !(
    isPriceRangeUpdated ||
    isActiveUnitChanged ||
    isUnitRangeUpdated
  );

  const appendToUrl = () => {
    // Construct an array of [key, value] pairs for the new query parameters
    const queryParamsArray = Object.entries({
      ...router.query,
      page: "1", // Set page to 1 when applying filters, ensure value is a string
      price_range: isPriceRangeUpdated
        ? priceSliderValues.join(",")
        : undefined,
      unit_type: activeUnit || undefined, // Conditionally include unit_type
      unit_measurement_range:
        activeUnit &&
        JSON.stringify(initialUnitSliderValues[activeUnit]) !==
          JSON.stringify(unitSliderValues[activeUnit])
          ? unitSliderValues[activeUnit]?.join(",")
          : undefined,
    });

    // Filter out any undefined or unwanted values and reconstruct the query object
    const updatedQuery = Object.fromEntries(
      queryParamsArray.filter(([_, value]) => value !== undefined)
    );

    router.push(
      {
        pathname: router.pathname,
        query: updatedQuery,
      }
      // undefined,
      // { shallow: true }
    );
  };

  return (
    <Drawer
      opened={opened}
      onClose={() => {
        setActiveUnit(searchedProductsMetaData.active_unit);
        setUnitSliderValues(initialUnitSliderValues);
        setPriceSliderValues(initialPriceRange);
        close();
      }}
      position="right"
    >
      <Flex direction="column" style={{ height: "calc(100vh - 80px)" }}>
        <div style={{ flexGrow: 1 }}>
          <Text mb="md">Filter by price</Text>
          <RangeSliderComponent
            unit="euros"
            min={searchedProductsMetaData.price_range_info.min}
            max={searchedProductsMetaData.price_range_info.max}
            rangeValue={priceSliderValues}
            setSliderRangeValues={(_, val) => {
              setPriceSliderValues(val);
            }}
          />
          <Text mb="md">Filter by available measurment types</Text>

          <Grid>
            {searchedProductsMetaData.units_range_list.map(
              (unit_type_data, index) => (
                <Grid.Col span={6} key={index}>
                  <FilterOptionCard
                    unit={unit_type_data.name}
                    count={unit_type_data.count}
                    onCardClick={(unit) => {
                      setUnitSliderValues(initialUnitSliderValues);
                      setActiveUnit(unit);
                    }}
                    isSelected={activeUnit === unit_type_data.name}
                  />
                </Grid.Col>
              )
            )}
          </Grid>

          {searchedProductsMetaData.units_range_list.map(
            (unit_type_data, index) => {
              if (activeUnit === unit_type_data.name) {
                return (
                  <RangeSliderComponent
                    key={index}
                    unit={unit_type_data.name}
                    min={unit_type_data.min}
                    max={unit_type_data.max}
                    rangeValue={unitSliderValues[unit_type_data.name]!}
                    setSliderRangeValues={handleUnitSliderChange}
                  />
                );
              }
              return null;
            }
          )}
        </div>
        <Button
          size="md"
          disabled={filterRequestDisabled}
          fullWidth
          onClick={() => {
            appendToUrl();
            close();
          }}
        >
          LOAD RESULTS
        </Button>
      </Flex>
    </Drawer>
  );
};

type RangeSliderComponentProps = {
  unit: SearchedProduct["unit_type"] | "euros";
  min: number;
  max: number;
  rangeValue: [number, number];
  setSliderRangeValues: (
    unit: SearchedProduct["unit_type"],
    values: [number, number]
  ) => void;
};

function RangeSliderComponent({
  unit,
  min,
  max,
  rangeValue,
  setSliderRangeValues,
}: RangeSliderComponentProps) {
  function valueLabelFormat(value: number, currentUnit: string) {
    let displayUnit = currentUnit;
    let scaledValue = value;

    // Specific case for euros
    if (currentUnit === "euros") {
      return `€${Math.round(value)}`;
    }

    // Handling KG and L with specific scaling and unit changes
    if (currentUnit === "KG" || currentUnit === "L") {
      if (value < 1) {
        scaledValue = Math.round(value * 1000);
        displayUnit = currentUnit === "KG" ? "mg" : "ml";
      } else {
        scaledValue = Math.round(value * 10) / 10; // Keep only one decimal for KG and L
        displayUnit = currentUnit === "KG" ? "kg" : "litre";
      }
    }

    // Handling M and M2 without changes to scaledValue
    if (currentUnit === "M" || currentUnit === "M2") {
      displayUnit = currentUnit.toLowerCase();
    }

    // Handling EACH with singular or plural terms
    if (currentUnit === "EACH") {
      displayUnit = value === 1 ? "item" : "items";
    }

    // Handling HUNDRED_SHEETS as a fixed unit
    if (currentUnit === "HUNDRED_SHEETS") {
      displayUnit = "(100 sheets)";
    }

    // For other units or default case, just round the value
    scaledValue = Math.round(scaledValue);

    return `${scaledValue} ${displayUnit}`;
  }

  // Define custom step and minRange based on unit
  let step, minRange;
  if (["euros", "M", "EACH", "HUNDRED_SHEETS", "M2"].includes(unit)) {
    step = 1;
    minRange = 1;
  } else if (["KG", "L"].includes(unit)) {
    step = 0.1;
    minRange = 0.1;
  } else {
    step = 1;
    minRange = 1;
  }

  return (
    <RangeSlider
      size="lg"
      py={40}
      m="xl"
      step={step}
      min={min}
      max={max}
      minRange={minRange}
      labelAlwaysOn
      value={rangeValue}
      onChange={(val) => {
        if (unit === "euros") {
          unit = "EACH";
        }
        setSliderRangeValues(unit, val);
      }}
      label={(value) => <Text size="xs">{valueLabelFormat(value, unit)}</Text>}
    />
  );
}
