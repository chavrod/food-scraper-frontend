"use client";
import { useRouter } from "next/navigation";
import { ReactElement, useState, useEffect } from "react";
// External
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
} from "@mantine/core";
// Intenral Utils
import { Product, ScrapeSummary, SearchMetaData } from "@/utils/types";
// Intenral Components

interface SearchResultsProps {
  searchText?: string;
  isCachedResults: boolean;
  products?: Product[] | false;
  summaryPerShop: ScrapeSummary[];
  searchMetaData: SearchMetaData | {};
}

export default function SearchResults({
  searchText,
  isCachedResults,
  products = [],
  summaryPerShop,
  searchMetaData,
}: SearchResultsProps): ReactElement {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isProductsFound, setIsProductsFound] = useState(false);
  const [isSearchPerformed, setIsSearchPerformed] = useState(false);

  console.log(isCachedResults);

  const form = useForm({
    initialValues: {
      q: searchText || "",
      p: 1,
    },

    validate: {
      q: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  const handleFormSubmit = (values: { q: string; p: number }) => {
    router.push(`?q=${values.q}&p=${values.p}`);

    setLoading(true);
    setIsSearchPerformed(true);
  };

  useEffect(() => {
    console.log("useEffect EXECUTED");

    if (!searchText) return;

    if (products) {
      setIsProductsFound(true);
      setLoading(false);
    } else {
      setIsProductsFound(true);
      setLoading(false);
    }
    setIsSearchPerformed(false);
  }, [searchText, products]); // Re-run the effect when results change

  return (
    <>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Group mb="md">
          <TextInput
            id="1"
            withAsterisk
            placeholder="Type a product name"
            disabled={loading}
            {...form.getInputProps("q")}
          />
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </Group>
      </form>
      {loading && isCachedResults && (
        <Stack>
          The results were cached, this should not take long!!
          <Loader
            size="xl"
            style={{ textAlign: "center", margin: "20px auto" }}
          />
        </Stack>
      )}
      {loading && !isCachedResults && (
        <Stack>
          Results were NOT cached....Wait one minute...
          <Loader
            size="xl"
            style={{ textAlign: "center", margin: "20px auto" }}
          />
        </Stack>
      )}
      {!loading && !isProductsFound && isSearchPerformed && (
        <>Sorry, nothinh was found at this search</>
      )}
      {!loading && isProductsFound && (
        <Stack>
          <Stack>
            <Text>Results summary</Text>
            <Group>
              {summaryPerShop.map((item, index) => (
                <Paper key={index}>
                  <Stack>
                    <Text>{item.shopName}</Text>
                    <Text>{item.count}</Text>
                  </Stack>
                </Paper>
              ))}
            </Group>
          </Stack>
          <Grid gutter="md" justify="center">
            {products.map((product, index) => (
              <Grid.Col key={index} span={12} md={6} lg={4}>
                <Paper
                  p="sm"
                  shadow="sm"
                  radius="md"
                  style={{ textAlign: "center" }}
                >
                  <Group noWrap>
                    <Container>
                      <img
                        src={product.imgSrc}
                        alt={product.name}
                        style={{ maxWidth: "5rem" }}
                      />
                    </Container>
                    <Stack spacing={0}>
                      <Text fz="sm" align="left">
                        {product.name}
                      </Text>
                      <Text fz="sm" align="left">
                        Shop: {product.shopName}
                      </Text>
                    </Stack>
                    <Container>
                      <Text align="center">
                        {product.price
                          ? `€${product.price.toFixed(2)}`
                          : "Price not available"}
                      </Text>
                    </Container>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      )}
    </>
  );
}
