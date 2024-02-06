// External Styling
import { Paper, Text, Stack, Title } from "@mantine/core";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
// Intenral: Utils
// Intenral: Components
import useRenderTime from "@/Components/RenderTimeNumber";

interface CountdownCircleProps {
  currentAverageScrapingTime: number | null;
  loading: boolean;
}

export default function CountdownCircle({
  currentAverageScrapingTime,
  loading,
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
            Hang tight! We are checking supermarkets for up-to-date product
            data. So far, this has taken us{" "}
            {Math.ceil(currentAverageScrapingTime) + 10} seconds on average.
          </Text>
        )}

        {currentAverageScrapingTime && (
          <CountdownCircleTimer
            isPlaying={loading}
            duration={Math.ceil(currentAverageScrapingTime) + 5}
            colors={["#0C8599", "#15AABF", "#0CA678", "#37B24D"]}
            colorsTime={[10, 7, 4, 0]}
            strokeWidth={20}
          >
            {useRenderTime}
          </CountdownCircleTimer>
        )}
      </Stack>
    </Paper>
  );
}
