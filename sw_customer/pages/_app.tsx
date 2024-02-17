import "@/styles/global.css";
import "@/styles/countDownClock.css";

import type { AppProps } from "next/app";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import MainAppShell from "@/Components/AppLayout";
import { QueryClient, QueryClientProvider } from "react-query";
// import { SessionProvider } from "../Components/Provider";
import { SessionProvider } from "@/Context/SessionContext";
import { GlobalProvider } from "@/Context/globalContext";

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
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={() => {}}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme,
          primaryColor: "cyan",

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
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <GlobalProvider>
              <Notifications position="top-right" />
              <MainAppShell>
                <Component {...pageProps} />
              </MainAppShell>
            </GlobalProvider>
          </SessionProvider>
        </QueryClientProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}
