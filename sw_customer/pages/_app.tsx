import "@/styles/global.css";
import "@/styles/countDownClock.css";

import type { AppProps } from "next/app";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import MainAppShell from "@/Components/AppLayout";
import { SessionProvider } from "../Components/Provider";
import { GlobalProvider } from "@/Context/globalContext";
import NoSsr from "@/utils/NoSsr";

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
        <SessionProvider session={session}>
          <GlobalProvider>
            <Notifications position="top-right" />
            <MainAppShell>
              {/* <NoSsr> */}
              <Component {...pageProps} />
              {/* </NoSsr> */}
            </MainAppShell>
          </GlobalProvider>
        </SessionProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

// backgroundColor: "#F1F3F5"
