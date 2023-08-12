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
// Intenral Utils
import { Product, ScrapeSummary, SearchMetaData } from "@/utils/types";
// Intenral Components

interface SearchResultsProps {
  products?: Product[];
  summaryPerShop: ScrapeSummary[];
  searchMetaData: SearchMetaData | {};
}

function isSearchMetaData(obj: any): obj is SearchMetaData {
  return "totalPages" in obj;
}

export default function SearchResults({
  products = [],
  summaryPerShop,
  searchMetaData,
}: SearchResultsProps): ReactElement {
  const [loading, setLoading] = useState(false);
  const [activePage, setPage] = useState(1);

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
      {isSearchMetaData(searchMetaData) && searchMetaData.totalPages && (
        <Pagination
          mb={30}
          pb="xl"
          spacing={5}
          value={activePage}
          onChange={setPage}
          total={searchMetaData.totalPages}
        />
      )}
    </Stack>
  );
}
