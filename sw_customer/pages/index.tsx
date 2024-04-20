import React from "react";
import { Stack, Flex } from "@mantine/core";
import BasketPreview from "@/Components/BasketPreview";
import SearchResults from "@/Components/SearchResults";
import NoSsr from "@/utils/NoSsr";
import useSearchedProducts from "@/hooks/useProducts";

export default function HomePage() {
  const { isLoading, searchedProducts } = useSearchedProducts();

  return (
    <Flex
      justify={!isLoading && !searchedProducts ? "center" : "space-between"}
      align={!isLoading && !searchedProducts ? "center" : "flex-start"}
      direction="row"
      wrap="nowrap"
      style={{ width: "100%", height: "100%" }}
    >
      <Stack align="center" spacing={0} style={{ flexGrow: "1" }}>
        <NoSsr>
          <SearchResults />
        </NoSsr>
      </Stack>
      {!(!isLoading && !searchedProducts) && (
        <NoSsr>
          <BasketPreview />
        </NoSsr>
      )}
    </Flex>
  );
}
