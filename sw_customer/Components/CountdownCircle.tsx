"use client";

// External Styling
import { Paper, Text, Stack, Title } from "@mantine/core";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
// Intenral: Utils
import { ItemsLoadingStates } from "./SearchResults";
// Intenral: Components
import renderTime from "@/Components/RenderTimeNumber";

interface CountdownCircleProps {
  currentAverageScrapingTime: number | null;
  loadingStates: ItemsLoadingStates;
}

export default function CountdownCircle({
  currentAverageScrapingTime,
  loadingStates,
}: CountdownCircleProps) {
  return (
    <Paper shadow="md" radius="md" p="md">
      <Stack mt={20} mb={5} align="center">
        <Title align="center" w={300}>
          {" "}
          Searching supermarkets...
        </Title>
        {currentAverageScrapingTime && (
          <Text align="center" color="dimmed" w={300}>
            Hang tight! We're checking supermarkets for up-to-date product data.
            So far, this has taken us{" "}
            {Math.ceil(currentAverageScrapingTime) + 10} seconds on average.
          </Text>
        )}

        {currentAverageScrapingTime && (
          <CountdownCircleTimer
            isPlaying={
              loadingStates.loading &&
              loadingStates.loadingNew &&
              !loadingStates.loadingCached
            }
            duration={Math.ceil(currentAverageScrapingTime) + 5}
            colors={["#0C8599", "#15AABF", "#0CA678", "#37B24D"]}
            colorsTime={[10, 7, 4, 0]}
            strokeWidth={20}
          >
            {renderTime}
          </CountdownCircleTimer>
        )}
      </Stack>
    </Paper>
  );
}