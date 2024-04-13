import React, { useState, useEffect } from "react";
import {
  IconScale,
  IconDroplet,
  IconHash,
  IconRuler2,
  IconSquareHalf,
  IconToiletPaper,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import {
  Grid,
  Paper,
  Text,
  Group,
  Stack,
  Button,
  Drawer,
  RangeSlider,
  Flex,
} from "@mantine/core";
import {
  SearchedProduct,
  SearchedProductMetadata,
} from "@/types/customer_types";

type FilterOptionCardProps = {
  unit: SearchedProduct["unit_type"];
  count: number;
  handleClick: () => void;
  isSelected: boolean;
};

function FilterOptionCard({
  unit,
  count,
  isSelected,
  handleClick,
}: FilterOptionCardProps) {
  const getIconForUnit = (currentUnit: SearchedProduct["unit_type"]) => {
    const size = "1.5rem";
    switch (currentUnit) {
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

  const getPrettyUnitName = (currentUnit: SearchedProduct["unit_type"]) => {
    switch (currentUnit) {
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
      onClick={handleClick}
    >
      <Group spacing="md">
        {getIconForUnit(unit)}
        <Stack spacing={0}>
          <Text>{getPrettyUnitName(unit)}</Text>
          <Text c="dimmed" size="sm">
            {count}
            {count === 1 ? "item" : "items"}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}

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
        let unitToDisplay: SearchedProduct["unit_type"];
        if (unit === "euros") {
          unitToDisplay = "EACH";
        } else {
          unitToDisplay = unit;
        }
        setSliderRangeValues(unitToDisplay, val);
      }}
      label={(value) => <Text size="xs">{valueLabelFormat(value, unit)}</Text>}
    />
  );
}

export default function FilterDrawer({
  opened,
  close,
  searchedProductsMetaData,
}: {
  opened: boolean;
  close: () => void;
  searchedProductsMetaData: SearchedProductMetadata;
}) {
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

  // Effect to update activeUnit when drawer opens
  useEffect(() => {
    if (opened) {
      setActiveUnit(searchedProductsMetaData.active_unit);
      setUnitSliderValues(initialUnitSliderValues);
      setPriceSliderValues(initialPriceRange);
    }
  }, [opened]);

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

  const isDefaultPriceRange =
    priceSliderValues[0] === 0 &&
    priceSliderValues[1] === searchedProductsMetaData.price_range_info.max;
  // Get the active unit range to work with
  const activeUnitRange = searchedProductsMetaData.units_range_list.find(
    (unitRange) => unitRange.name === activeUnit
  );
  const isDefaultUnitRange =
    activeUnit != null &&
    activeUnitRange &&
    unitSliderValues[activeUnit]?.[0] === activeUnitRange?.min &&
    unitSliderValues[activeUnit]?.[1] === activeUnitRange?.max;

  const appendToUrl = () => {
    // Construct an array of [key, value] pairs for the new query parameters
    const queryParamsArray = Object.entries({
      ...router.query,
      page: "1", // Set page to 1 when applying filters, ensure value is a string
      price_range: !isDefaultPriceRange
        ? priceSliderValues.join(",")
        : undefined,
      unit_type: activeUnit || undefined, // Conditionally include unit_type
      unit_measurement_range:
        activeUnit && !isDefaultUnitRange
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
      },
      undefined,
      { shallow: true }
    );
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Drawer
      opened={opened}
      onClose={close}
      position="right"
      title={
        <Text
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchEnd={() => setIsHovered(false)}
          c="brand.7"
          fw={500}
          style={{
            cursor: "pointer",
            textDecoration: isHovered ? "underline" : "none",
          }}
          onClick={() => {
            setPriceSliderValues([
              searchedProductsMetaData.price_range_info.min,
              searchedProductsMetaData.price_range_info.max,
            ]);
            setActiveUnit(null);
            const defaultUnitSliderValues: SliderValues = {};
            // Initialize state for each slider
            searchedProductsMetaData.units_range_list.forEach(
              (unit_type_data) => {
                defaultUnitSliderValues[unit_type_data.name] = [
                  unit_type_data.min,
                  unit_type_data.max,
                ];
              }
            );
            setUnitSliderValues(defaultUnitSliderValues);
          }}
        >
          Clear all filters
        </Text>
      }
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
                // eslint-disable-next-line react/no-array-index-key
                <Grid.Col span={6} key={index}>
                  <FilterOptionCard
                    unit={unit_type_data.name}
                    count={unit_type_data.count}
                    handleClick={() => {
                      if (unit_type_data.name === activeUnit) {
                        setActiveUnit(null);
                      } else {
                        setActiveUnit(unit_type_data.name);
                      }
                      setUnitSliderValues(initialUnitSliderValues);
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
                    key={unit_type_data.name}
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
}
