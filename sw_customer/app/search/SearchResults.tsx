"use client";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    console.log(averageScrapingTime);
    if (averageScrapingTime) {
      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          message: form.values.q,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        console.log("MESSAGE RECEIVED");
        const responseData = JSON.parse(event.data);
        console.log(responseData.message); // Process the received data as required
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
  }, [averageScrapingTime]);

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
  // TODO: Set loading on refresh

  // TODO: Make sure even if nothing is found, we still populate the

  // TODO: Make sure we do not end up in an infinite loop
  useEffect(() => {
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
