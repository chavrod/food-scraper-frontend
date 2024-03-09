import React from "react";
import {
  BackgroundImage,
  Text,
  Center,
  Title,
  Stack,
  Paper,
} from "@mantine/core";
import SearchHeader from "./SearchHeader";

export default function SearchIntro() {
  return (
    <Paper
      // shadow="sm"
      radius="lg"
      p="md"
      my="md"
      style={{ backgroundColor: "rgba(227, 250, 252, 0.95)" }}
    >
      <Stack align="center" justify="center" style={{ height: "100%" }} my="xl">
        <Title order={1} color="rgba(11, 114, 133, 1)">
          Shop Smart
        </Title>
        <Title order={5} color="rgba(11, 114, 133, 1)" align="center">
          Effortless grocery comparisons in Ireland
        </Title>
        <SearchHeader
          isLargerThanSm={true}
          isSearchBarVisible={true}
          handleHideSearchBar={() => {}}
        />
      </Stack>
    </Paper>
  );
}
