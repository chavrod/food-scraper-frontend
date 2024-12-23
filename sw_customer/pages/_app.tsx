import "@/styles/global.css";
import "@/styles/countDownClock.css";

import React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import MainAppShell from "@/Components/AppLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthContextProvider } from "@/utils/auth/index";
import { GlobalProvider } from "@/Context/globalContext";
import { AuthRoutingProvider } from "@/utils/auth/routing";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  // const toggleColorScheme = (value?: ColorScheme) =>
  //   setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  const colorScheme = "light";

  return (
    <>
      <Head>
        <title>Shop Wiz</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/app-logo-logo-removebg.ico" />
      </Head>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={() => {}}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            colorScheme,
            colors: {
              brand: [
                "#E3FAFC",
                "#C5F6FA",
                "#99E9F2",
                "#66D9E8",
                "#3BC9DB",
                "#22B8CF",
                "#15AABF",
                "#1098AD",
                "#0C8599",
                "#0B7285",
              ],
            },
            primaryColor: "brand",

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
          <AuthContextProvider>
            <AuthRoutingProvider>
              <QueryClientProvider client={queryClient}>
                <GlobalProvider>
                  <Notifications position="top-right" />
                  <MainAppShell>
                    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                    <Component {...pageProps} />
                    <ReactQueryDevtools />
                  </MainAppShell>
                </GlobalProvider>
              </QueryClientProvider>
            </AuthRoutingProvider>
          </AuthContextProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
}
