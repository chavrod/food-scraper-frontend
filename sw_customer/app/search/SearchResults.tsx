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
} from "@mantine/core";
// Intenral Utils
import { Product, SearchMetaData, ScrapeStats } from "@/utils/types";
// Intenral Components

interface SearchResultsProps {
  searchText?: string;
  products?: Product[] | undefined;
  searchMetaData: SearchMetaData | {};
  averageScrapingTime: number | null;
}

export default function SearchResults({
  searchText,
  products,
  searchMetaData,
  averageScrapingTime,
}: SearchResultsProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("query");

  const [loading, setLoading] = useState(false);
  const [currentAverageScrapingTime, setCurrentAverageScrapingTime] = useState<
    number | null
  >(averageScrapingTime || null);
  const [currentProducts, setCurrentProducts] = useState<Product[] | null>(
    products || null
  );

  // TODO: Clean up the effect?
  useEffect(() => {
    if (products) setCurrentProducts(products);
    if (averageScrapingTime) setCurrentAverageScrapingTime(averageScrapingTime);
  }, [averageScrapingTime, products]);

  useEffect(() => {
    console.log("AVERAGE SCRAPING TIME: ", averageScrapingTime);
    if (currentAverageScrapingTime) {
      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: form.values.query,
          is_relevant_only: form.values.is_relevant_only,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        console.log("MESSAGE RECEIVED");
        const responseData = JSON.parse(event.data);

        if (responseData) {
          setCurrentProducts(responseData.results);
          setCurrentAverageScrapingTime(null);
          console.log(responseData);
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
      is_relevant_only: "true",
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  const handleFormSubmit = (values: {
    query: string;
    page: number;
    is_relevant_only: string;
  }) => {
    router.push(
      `?query=${values.query}&page=${values.page}&is_relevant_only=${values.is_relevant_only}`
    );

    setLoading(true);
  };
  // TODO: Set loading on refresh

  // TODO: Make sure even if nothing is found, we still populate the

  // TODO: Make sure we do not end up in an infinite loop
  useEffect(() => {
    if (!currentAverageScrapingTime && currentProducts) setLoading(false);
  }, [currentProducts, currentAverageScrapingTime]);

  return (
    <>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Group mb="md">
          <TextInput
            id="1"
            withAsterisk
            placeholder="Type a product name"
            disabled={loading}
            {...form.getInputProps("query")}
          />
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </Group>
      </form>
      {loading && searchText !== "" && (
        <Stack>
          {currentAverageScrapingTime ? (
            <>
              Results were NOT cached....Wait a bit... So far is has taken{" "}
              {currentAverageScrapingTime} seconds on average to scrape the
              data.
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

      {!loading && currentProducts && currentProducts.length > 0 && (
        <Grid gutter="md" justify="center">
          {currentProducts.map((product, index) => (
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
      )}

      {queryParam &&
        !loading &&
        currentProducts &&
        currentProducts.length === 0 && <>Sorry, there was nothing found!</>}
    </>
  );
}
