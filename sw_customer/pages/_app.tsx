import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  AppShell,
  Navbar,
  Header,
  Modal,
  Group,
  Footer,
  NavLink,
  ActionIcon,
  Container,
  Stack,
  Menu,
  Text,
  Avatar,
  Paper,
  Box,
  Title,
  Badge,
  Button,
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import {
  Icon,
  IconCalculator,
  IconChartHistogram,
  IconUserCircle,
  IconLifebuoy,
  IconLogout,
  IconSettings,
  IconLogin,
  IconCircleCheckFilled,
  IconCompass,
  IconShoppingCart,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
// Internal: Components
import UserAccess from "../Components/UserAccess";
// Internal: Utils
import { logout } from "@/utils/auth";
import { useGlobalContext } from "@/Context/globalContext";

import { SessionProvider } from "../Components/Provider";
import { GlobalProvider } from "@/Context/globalContext";

interface Route {
  link: string;
  label: string;
  icon: Icon;
  footer: boolean;
  navbar: boolean;
  isLoggedInVisible: boolean;
  isLoggedOutVisible: boolean;
  onClick: boolean | (() => void);
}

export default function App({ Component, pageProps }: AppProps) {
  // const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  // const toggleColorScheme = (value?: ColorScheme) =>
  //   setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  const colorScheme = "light";

  const router = useRouter();

  const { basketItems, isLargerThanSm } = useGlobalContext();
  const { metaData: basketItemsMetaData } = basketItems.responseData;
  const basketQty = basketItemsMetaData?.total_quantity || 0;

  const [isEmailConfirmed, setIsEmailConfirmed] = useState(
    router.query["login"] === "successful-email-confirmation"
  );
  const [isPasswordReset, setIsPasswordReset] = useState(
    router.query["password-reset"] === "successful-password-reset"
  );
  const [isRedirectToLogin, setIsRedirectToLogin] = useState(
    router.query["login"] === "open"
  );
  const [callBackUrl, setCallBackUrl] = useState(router.query["callbackUrl"]);

  const [opened, { open, close }] = useDisclosure(false);

  const { data: session } = useSession();

  interface Route {
    link: string;
    label: string;
    icon: Icon;
    footer: boolean;
    navbar: boolean;
    isLoggedInVisible: boolean;
    isLoggedOutVisible: boolean;
    onClick: boolean | (() => void);
  }

  const routes: Route[] = [
    {
      link: "/",
      label: "Explore",
      icon: IconCompass,
      footer: true,
      navbar: true,
      isLoggedInVisible: true,
      isLoggedOutVisible: true,
      onClick: false,
    },

    {
      link: "/estimate",
      label: "Estimate",
      icon: IconCalculator,
      footer: true,
      navbar: true,
      isLoggedInVisible: true,
      isLoggedOutVisible: true,
      onClick: false,
    },
    {
      link: "/login",
      label: "Log in",
      icon: IconUserCircle,
      footer: true,
      navbar: false,
      isLoggedInVisible: false,
      isLoggedOutVisible: true,
      onClick: () => {
        open();
      },
    },
    {
      link: "/track",
      label: "Track",
      icon: IconChartHistogram,
      footer: true,
      navbar: true,
      isLoggedInVisible: true,
      isLoggedOutVisible: false,
      onClick: false,
    },
  ];

  useEffect(() => {
    if (session) {
      basketItems.request();
    }
  }, [session]);

  const handleLoginSucess = () => {
    close();

    if (callBackUrl) {
      const decodedCallbackUrl = decodeURIComponent(callBackUrl);

      router.push(decodedCallbackUrl);
    }
  };

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
        <GlobalProvider>
          <SessionProvider>
            <Notifications position="top-right" />
            <AppShell
              styles={(theme) => ({
                main: {
                  paddingTop: 80,
                  paddingLeft: 0,
                  paddingRight: 0,
                },
              })}
              header={
                <Header height={80} p="lg">
                  <Group position="apart" spacing="xs" noWrap>
                    <Group>
                      <Link href="/">
                        <img
                          src="/shopping_wiz_logo.png"
                          alt="Shopping Wiz logo"
                          style={{ maxWidth: "9rem" }}
                        />
                      </Link>
                      {isLargerThanSm && (
                        <Group>
                          {routes
                            .filter((r) => r.navbar)
                            .map((r, i) => (
                              <Link
                                key={i}
                                href={r.link}
                                style={{ textDecoration: "none" }}
                              >
                                <NavLink
                                  my={4}
                                  label={r.label}
                                  icon={<r.icon size="1.5rem" stroke={1.5} />}
                                  active={r.link === router.pathname}
                                  variant="filled"
                                />
                              </Link>
                            ))}
                        </Group>
                      )}
                    </Group>
                    <Group>
                      {session ? (
                        <>
                          <ActionIcon
                            size={36.5}
                            radius="md"
                            sx={{
                              "&:hover": {
                                backgroundColor: "#3BC9DB",
                              },
                              backgroundColor:
                                router.pathname === "/basket"
                                  ? "#3BC9DB"
                                  : "#E3FAFC",
                              cursor: "pointer",
                              width: "85px",
                              borderWidth: 0,
                            }}
                            variant="filled"
                            color="cyan.0"
                            onClick={() => {}}
                          >
                            <Link
                              href="/basket"
                              style={{ textDecoration: "none" }}
                            >
                              <Badge
                                leftSection={
                                  <IconShoppingCart
                                    size="1.3rem"
                                    stroke="0.12rem"
                                    color="#15AABF"
                                  />
                                }
                                radius="md"
                                size="lg"
                              >
                                {session && basketQty
                                  ? basketQty > 99
                                    ? "99+"
                                    : basketQty
                                  : 0}
                              </Badge>
                            </Link>
                          </ActionIcon>

                          <Menu
                            shadow="md"
                            width={200}
                            position="bottom-end"
                            offset={3}
                          >
                            <Menu.Target>
                              <Avatar
                                color={session ? "cyan" : "gray"}
                                radius="md"
                              >
                                {session && session.user.username.length > 2 ? (
                                  session.user.username
                                    .slice(0, 2)
                                    .toUpperCase()
                                ) : (
                                  <IconUserCircle
                                    size="1.8rem"
                                    stroke="0.09rem"
                                  />
                                )}
                              </Avatar>
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Label>{session.user.email}</Menu.Label>
                              <Menu.Item icon={<IconLifebuoy size={14} />}>
                                Help
                              </Menu.Item>
                              <Menu.Item icon={<IconSettings size={14} />}>
                                <Link
                                  href="/account-settings"
                                  style={{
                                    textDecoration: "none",
                                    color: "black",
                                  }}
                                >
                                  Account Settings
                                </Link>
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                onClick={() => logout(session.refresh_token)}
                                // onClick={() => signOut()}
                                icon={<IconLogout size={14} />}
                              >
                                Log Out
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </>
                      ) : (
                        <Group>
                          <Button onClick={() => open()}> Log in</Button>
                          <Button>Help</Button>
                        </Group>
                      )}
                    </Group>
                  </Group>
                </Header>
              }
              footer={
                !isLargerThanSm ? (
                  <Footer height={60} p="xs">
                    <Group
                      position={session ? "apart" : "center"}
                      spacing={!session ? "xl" : ""}
                    >
                      {routes
                        .filter((r) => r.footer)
                        .filter((r) =>
                          session ? r.isLoggedInVisible : r.isLoggedOutVisible
                        )
                        .map((r, i) =>
                          typeof r.onClick === "function" ? (
                            // When onClick is a function
                            <Stack key={i} align="center" spacing={0}>
                              <ActionIcon
                                onClick={r.onClick}
                                style={{ cursor: "pointer" }}
                                variant="subtle"
                                color={
                                  r.link === router.pathname
                                    ? "primary"
                                    : "gray"
                                }
                              >
                                <r.icon />
                              </ActionIcon>
                              <Text color="dimmed" fz="xs">
                                {r.label}
                              </Text>
                            </Stack>
                          ) : (
                            // When onClick is not a function (i.e., is false)
                            <Link
                              key={i}
                              href={r.link}
                              style={{ textDecoration: "none" }}
                            >
                              <Stack align="center" spacing={0}>
                                <ActionIcon
                                  variant="subtle"
                                  color={
                                    r.link === router.pathname
                                      ? "primary"
                                      : "gray"
                                  }
                                >
                                  <r.icon />
                                </ActionIcon>
                                <Text color="dimmed" fz="xs">
                                  {r.label}
                                </Text>
                              </Stack>
                            </Link>
                          )
                        )}
                    </Group>
                  </Footer>
                ) : (
                  <Footer height={0}>
                    <Container></Container>
                  </Footer>
                )
              }
            >
              <Modal
                opened={
                  opened ||
                  isEmailConfirmed ||
                  isPasswordReset ||
                  isRedirectToLogin
                }
                onClose={() => {
                  if (isEmailConfirmed) setIsEmailConfirmed(false);
                  if (isRedirectToLogin) setIsRedirectToLogin(false);
                  if (isPasswordReset) setIsPasswordReset(false);
                  if (isEmailConfirmed || isPasswordReset)
                    window.history.replaceState(null, "", "/");
                  close();
                }}
                title={isPasswordReset ? "" : "Log in or sign up"}
                centered
              >
                {isPasswordReset ? (
                  <Box maw={400} pos="relative">
                    <Paper p="md" style={{ maxWidth: 400, margin: "0 auto" }}>
                      <Stack
                        justify="center"
                        style={{ textAlign: "center" }}
                        align="center"
                      >
                        <IconCircleCheckFilled
                          size={80}
                          style={{ color: "green", marginBottom: "10px" }}
                        />
                        <Title align="center" order={2}>
                          Great success!
                          <Title align="center" order={2}>
                            Password has been reset.
                          </Title>
                        </Title>
                        <Text align="center" size="lg">
                          The next time you log in, please use your new
                          password.
                        </Text>
                      </Stack>
                    </Paper>
                  </Box>
                ) : (
                  <UserAccess
                    isEmailConfirmed={isEmailConfirmed}
                    handleLoginSucess={handleLoginSucess}
                  />
                )}
              </Modal>
              <Component {...pageProps} />
            </AppShell>
          </SessionProvider>
        </GlobalProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

// backgroundColor: "#F1F3F5"
