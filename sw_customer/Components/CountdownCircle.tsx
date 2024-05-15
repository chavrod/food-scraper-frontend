import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Paper, Text, Stack, Title, Alert, Button } from "@mantine/core";
import { IconBulbFilled } from "@tabler/icons-react";
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
  const [uselessFact, setUselessFact] = useState(null);
  const [loadingFact, setLoadingFact] = useState(false);

  const fetchUselessFact = async () => {
    setLoadingFact(true);
    try {
      const response = await fetch(
        "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en"
      );
      const data = await response.json();
      setUselessFact(data.text);
    } catch (error) {
      console.error("Error fetching useless fact:", error);
    }
    setLoadingFact(false);
  };

  useEffect(() => {
    fetchUselessFact();
  }, []);

  return (
    <Paper shadow="md" radius="md" p="sm">
      <Stack mt={5} mb={5} align="center">
        <Title order={2} align="center" w={300}>
          {" "}
          Searching supermarkets...
        </Title>
        <Link href="/" legacyBehavior>
          <Text
            mt="xs"
            align="right"
            fw={600}
            size="lg"
            c="brand.9"
            sx={{
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Return to Homepage
          </Text>
        </Link>

        {currentAverageScrapingTime && (
          <CountdownCircleTimer
            isPlaying={loading}
            duration={Math.ceil(currentAverageScrapingTime)}
            colors={["#0C8599", "#15AABF", "#0CA678", "#37B24D"]}
            colorsTime={[10, 7, 4, 0]}
            strokeWidth={20}
          >
            {useRenderTime}
          </CountdownCircleTimer>
        )}

        <Alert
          icon={<IconBulbFilled size="1rem" />}
          title="Fun Useless Fact For the Impatient"
          color="brand.7"
          maw={290}
        >
          {loadingFact ? (
            <Text>Loading your useless fact...</Text>
          ) : uselessFact ? (
            <Text>{uselessFact}</Text>
          ) : (
            <Text>Sorry, there was an issue loading your useless fact.</Text>
          )}
          <Button
            mt={20}
            onClick={() => {
              if (loadingFact) return;
              fetchUselessFact();
            }}
            loading={loadingFact}
          >
            Another Useless Fact
          </Button>
        </Alert>
      </Stack>
    </Paper>
  );
}
