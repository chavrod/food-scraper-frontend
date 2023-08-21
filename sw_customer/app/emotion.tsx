"use client";

import { useState } from "react";
import { CacheProvider } from "@emotion/react";
import {
  useEmotionCache,
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { useServerInsertedHTML } from "next/navigation";

export default function RootStyleRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const cache = useEmotionCache();
  cache.compat = true;

  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(" "),
      }}
    />
  ));

  return (
    <CacheProvider value={cache}>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            colorScheme,
            colors: {
              // Add your color
              deepBlue: ["#E9EDFC", "#C1CCF6", "#99ABF0" /* ... */],
            },

            shadows: {
              md: "1px 1px 3px rgba(0, 0, 0, .25)",
              xl: "5px 5px 3px rgba(0, 0, 0, .25)",
            },

            headings: {
              fontFamily: "Roboto, sans-serif",
              sizes: {
                h1: { fontSize: "2rem" },
              },
            },
          }}
        >
          {children}
        </MantineProvider>
      </ColorSchemeProvider>
    </CacheProvider>
  );
}