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
  Pagination,
  Skeleton,
} from "@mantine/core";
// Intenral Utils
import { Product, SearchMetaData } from "@/utils/types";
// Intenral Components

interface SearchResultsProps {
  searchText?: string;
  products?: Product[] | undefined;
  searchMetaData: SearchMetaData;
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

  const [loading, setLoading] = useState(true);
  const [currentAverageScrapingTime, setCurrentAverageScrapingTime] = useState<
    number | null
  >(averageScrapingTime || null);
  const [currentProducts, setCurrentProducts] = useState<Product[] | null>(
    products || null
  );
  const [pages, setPages] = useState<{
    activePage: number | undefined;
    totalPages: number | undefined;
  }>({
    activePage: searchMetaData?.currentPage || undefined,
    totalPages: searchMetaData?.totalPages || undefined,
  });

  useEffect(() => {
    if (products) setCurrentProducts(products);
    if (averageScrapingTime) setCurrentAverageScrapingTime(averageScrapingTime);
    if (searchMetaData.currentPage !== 0 && searchMetaData.totalPages !== 0)
      setPages({
        activePage: searchMetaData.currentPage,
        totalPages: searchMetaData.totalPages,
      });
  }, [averageScrapingTime, products, searchMetaData]);

  useEffect(() => {
    console.log("AVERAGE SCRAPING TIME: ", averageScrapingTime);
    if (currentAverageScrapingTime) {
      const socket = new WebSocket("ws://localhost:8000/ws/scraped_result/");

      socket.onopen = () => {
        console.log("WebSocket is connected.");

        // Sending a message to the server after connection
        const messageData = {
          query: form.values.query,
          sender: "Client",
        };

        socket.send(JSON.stringify(messageData));
      };

      socket.onmessage = (event) => {
        console.log("MESSAGE RECEIVED");
        const responseData = JSON.parse(event.data);

        if (responseData.results) {
          setCurrentProducts(responseData.results);
          setCurrentAverageScrapingTime(null);
          setPages({
            activePage: 1,
            totalPages: responseData.total_pages,
          });
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
    },

    validate: {
      query: (value: string) => (value.length <= 0 ? "Invalid name" : null),
    },
  });

  const handleFormSubmit = (values: { query: string; page: number }) => {
    router.push(`?query=${values.query}&page=${values.page}`);

    setLoading(true);
  };

  const handlePageChange = (page: number) => {
    setPages((prev) => ({ ...prev, activePage: page }));

    // Scroll smoothly to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });

    setLoading(true);

    // Wait for the scroll to complete (you can adjust the timeout as needed)
    setTimeout(() => {
      router.push(`?query=${queryParam}&page=${page}`);
    }, 500); // Adjust this time based on your scrolling speed
  };

  useEffect(() => {
    if (!currentAverageScrapingTime && currentProducts) setLoading(false);
  }, [currentProducts, currentAverageScrapingTime]);

  return (
    <Stack align="center">
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

      {loading ? (
        <Grid gutter="md" justify="center">
          {/* Adjust the number of Skeletons based on your grid layout */}
          {Array.from({ length: 24 }).map((_, index) => (
            <Grid.Col key={index} span={12} md={6} lg={4}>
              <Paper h="100%" shadow="md" withBorder p="sm" radius="md">
                <Skeleton height={200} circle mb="xl" /> {/* Image skeleton */}
                <Skeleton height={8} mb="sm" /> {/* Title skeleton */}
                <Skeleton height={8} width="70%" /> {/* Price skeleton */}
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        currentProducts &&
        currentProducts.length > 0 && (
          <Stack align="center" spacing={0}>
            <Grid gutter="md" justify="center">
              {currentProducts.map((product, index) => (
                <Grid.Col key={index} span={12} md={6} lg={4}>
                  <Paper
                    h="100%"
                    shadow="md"
                    withBorder
                    p="sm"
                    radius="md"
                    style={{ cursor: "pointer", textAlign: "center" }}
                  >
                    <Group noWrap>
                      <Container>
                        <img
                          src={product.imgSrc}
                          alt={product.name}
                          style={{ maxWidth: "5rem" }}
                        />
                      </Container>

                      <Text fz="sm" align="left">
                        {product.name}
                      </Text>

                      <Stack>
                        <Text align="center">
                          {product.price
                            ? `€${product.price.toFixed(2)}`
                            : "Price not available"}
                        </Text>
                        <img
                          src={`/brand-logos/${product.shopName}.jpeg`}
                          alt={product.shopName}
                          style={{ maxWidth: "3rem" }}
                        />
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
            {pages.totalPages && pages.totalPages > 0 ? (
              <Pagination
                mb={30}
                py="xl"
                spacing={5}
                value={pages.activePage}
                onChange={(p) => handlePageChange(p)}
                total={pages.totalPages}
              />
            ) : null}
          </Stack>
        )
      )}

      {queryParam &&
        !loading &&
        currentProducts &&
        currentProducts.length === 0 && <>Sorry, there was nothing found!</>}
    </Stack>
  );
}
