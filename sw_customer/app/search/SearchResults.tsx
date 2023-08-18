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
import {
  Product,
  ScrapeSummary,
  SearchMetaData,
  ScrapeStats,
} from "@/utils/types";
// Intenral Components

interface SearchResultsProps {
  searchText?: string;
  products?: Product[] | undefined;
  summaryPerShop: ScrapeSummary[];
  searchMetaData: SearchMetaData | {};
  averageScrapingTime: number | null;
}

export default function SearchResults({
  searchText,
  products,
  summaryPerShop,
  searchMetaData,
  averageScrapingTime,
}: SearchResultsProps): ReactElement {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

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
    router.push(`?query=${values.q}&page=${values.p}`);

    setLoading(true);
  };

  // TODO: Make sure even if nothing is found, we still populate the

  useEffect(() => {
    console.log("helooo");
    console.log(form.values.q);
    console.log(products);
    if (form.values.q !== "" && !products) setLoading(true);
    if (!averageScrapingTime && products) setLoading(false);
  }, [products, averageScrapingTime, form.values.q]);

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
      {loading && (
        <Stack>
          {averageScrapingTime ? (
            <>
              Results were NOT cached....Wait a bit... So far is has taken{" "}
              {averageScrapingTime} seconds on average
            </>
          ) : (
            <>Processing request!!</>
          )}

          <Loader
            size="xl"
            style={{ textAlign: "center", margin: "20px auto" }}
          />
        </Stack>
      )}

      {!loading && products && products.length > 0 && (
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

      {!loading && products && products.length === 0 && (
        <>Sorry, there was nothing found!</>
      )}
    </>
  );
}
