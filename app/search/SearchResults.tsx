"use client";
import { ReactElement, useState, useEffect } from "react";
import {
  Loader,
  Grid,
  Paper,
  Text,
  Group,
  Container,
  Stack,
  Pagination,
} from "@mantine/core";

import { Product, ScrapeSummary } from "@/utils/types";

interface SearchResultsProps {
  products?: Product[];
  summary?: ScrapeSummary;
}

export default function SearchResults({
  products = [],
  summary,
}: SearchResultsProps): ReactElement {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!products[0]) return;
    setLoading(true); // Start the loading state

    setTimeout(() => {
      setLoading(false); // End the loading state after 2 seconds
    }, 2000); // Wait for 2 seconds
  }, [products]); // Re-run the effect when results change

  if (loading) {
    return (
      <Loader size="xl" style={{ textAlign: "center", margin: "20px auto" }} />
    );
  }

  return (
    <Stack>
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
      <Pagination pb="lg" spacing={5} total={summary?.count || 0} />
    </Stack>
  );
}
