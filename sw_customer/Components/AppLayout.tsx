import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Indicator,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  Icon,
  IconCalculator,
  IconChartHistogram,
  IconUserCircle,
  IconLifebuoy,
  IconLogout,
  IconSettings,
  IconCircleCheckFilled,
  IconCompass,
  IconShoppingCart,
  IconSearch,
} from "@tabler/icons-react";
import { useSessionContext } from "@/Context/SessionContext";
// Internal: Utils
import useBasketItems from "@/hooks/useBasketItems";
import useSearchedProducts from "@/hooks/useProducts";
import logout from "@/utils/auth";
import UserAccess from "./account/UserAccess";
import SearchHeader from "./SearchHeader";

interface Route {
  link: string;
  label: string;
  icon: Icon;
  footer: boolean;
  navbar: boolean;
  isLoggedInVisible: boolean;
  isLoggedOutVisible: boolean;
  showStats: boolean;
  stat?: string | number;
  onClick: boolean | (() => void);
}

export default function MainAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    query,
    searchedProducts,
    isLoading: loadingExistingProducts,
  } = useSearchedProducts();
  const { basketQty } = useBasketItems();

  // const isLargerThanSm = useMediaQuery("(min-width: 768px)", undefined, {
  //   getInitialValueInEffect: false,
  // });
  const isLargerThanSm = useMediaQuery("(min-width: 768px)");

  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [isRedirectToLogin, setIsRedirectToLogin] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Check for 'login' query parameter
    const loginQuery = router.query.login;
    setIsEmailConfirmed(loginQuery === "successful-email-confirmation");
    setIsRedirectToLogin(loginQuery === "open");

    // Check for 'password-reset' query parameter
    const passwordResetQuery = router.query["password-reset"];
    setIsPasswordReset(passwordResetQuery === "successful-password-reset");

    if (
      loginQuery === "successful-email-confirmation" ||
      loginQuery === "open" ||
      passwordResetQuery === "successful-password-reset"
    ) {
      open();
    }
  }, [router.query]);

  const [opened, { open, close }] = useDisclosure(false);

  const { session } = useSessionContext();

  const routes: Route[] = [
    {
      link: "/",
      label: "Explore",
      icon: IconCompass,
      footer: true,
      navbar: false,
      isLoggedInVisible: true,
      isLoggedOutVisible: true,
      onClick: false,
      showStats: false,
    },

    {
      link: "/basket",
      label: "Basket",
      icon: IconShoppingCart,
      footer: true,
      navbar: true,
      isLoggedInVisible: true,
      isLoggedOutVisible: false,
      onClick: false,
      showStats: true,
      stat: session && basketQty ? (basketQty > 99 ? "99+" : basketQty) : 0,
    },

    {
      link: "/estimate",
      label: "Estimate",
      icon: IconCalculator,
      footer: true,
      navbar: false,
      isLoggedInVisible: true,
      isLoggedOutVisible: true,
      onClick: false,
      showStats: false,
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
      showStats: false,
    },
    {
      link: "/track",
      label: "Track",
      icon: IconChartHistogram,
      footer: true,
      navbar: false,
      isLoggedInVisible: true,
      isLoggedOutVisible: false,
      onClick: false,
      showStats: false,
    },
  ];

  const handleLoginSucess = () => {
    close();
  };

  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const handleHideSearchBar = useCallback(() => {
    setIsSearchBarVisible(false);
  }, []);

  const handleImageClick = async () => {
    await router.push("/");
    if (router.pathname === "/") {
      router.reload();
    }
  };

  return (
    <AppShell
      styles={(theme) => ({
        main: {
          backgroundImage:
            router.pathname === "/" &&
            !query &&
            !loadingExistingProducts &&
            !searchedProducts
              ? "url(landing-background.webp)"
              : "",
          backgroundPosition: "center center",
          "@media (max-width: 768px)": {
            backgroundPosition: "top center",
            backgroundSize: "cover",
          },
          backgroundColor: "#f1f3f5",
          // backgroundColor: "#b2d1d6",
          paddingTop: 80,
          paddingLeft: 0,
          paddingRight: 0,
        },
      })}
      header={
        <Header
          height={80}
          p="lg"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
          }}
        >
          <Group
            style={{
              width: isSearchBarVisible && !isLargerThanSm ? "100%" : undefined,
              overflow: "hidden",
            }}
            mah={60}
          >
            {!(isSearchBarVisible && !isLargerThanSm) && (
              <>
                <img
                  src="/app-logo-logo.jpg"
                  alt="Shopping Wiz"
                  style={{
                    maxWidth: "9rem",
                    maxHeight: "3rem",
                    cursor: "pointer",
                  }}
                  onClick={handleImageClick}
                />

                <img
                  src="/app-logo-name.jpg"
                  alt="Logo"
                  style={{
                    maxWidth: isLargerThanSm ? "9rem" : "6rem",
                    maxHeight: "3rem",
                    cursor: "pointer",
                  }}
                  onClick={handleImageClick}
                />
              </>
            )}

            {isLargerThanSm || isSearchBarVisible ? (
              <SearchHeader
                isLargerThanSm={isLargerThanSm}
                isSearchBarVisible={isSearchBarVisible}
                handleHideSearchBar={handleHideSearchBar}
              />
            ) : (
              <ActionIcon type="submit" variant="transparent">
                <IconSearch onClick={() => setIsSearchBarVisible(true)} />
              </ActionIcon>
            )}
          </Group>
          {!(isSearchBarVisible && !isLargerThanSm) && (
            <Group>
              {isLargerThanSm && (
                <Group>
                  {routes
                    .filter((r) => r.navbar)
                    .map((r, i) => (
                      <Link
                        key={r.link}
                        href={r.link}
                        style={{ textDecoration: "none" }}
                      >
                        <Indicator
                          disabled={!r.showStats}
                          label={r.stat}
                          size={18}
                          offset={1}
                          color="red"
                        >
                          <NavLink
                            my={4}
                            label={r.label}
                            icon={<r.icon size="1.5rem" stroke={1.5} />}
                            active
                            variant={
                              r.link === router.pathname ? "filled" : "light"
                            }
                          />
                        </Indicator>
                      </Link>
                    ))}
                </Group>
              )}
              {session ? (
                <Menu shadow="md" width={200} position="bottom-end" offset={3}>
                  <Menu.Target>
                    <Avatar
                      color={session ? "brand" : "gray"}
                      radius={isLargerThanSm ? "" : "sm"}
                    >
                      {session && session.user.username.length > 2 ? (
                        session.user.username.slice(0, 2).toUpperCase()
                      ) : (
                        <IconUserCircle size="1.8rem" stroke="0.09rem" />
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
              ) : (
                <Group>
                  <Button onClick={() => open()}> Log in</Button>
                  {/* <Button>Help</Button> */}
                </Group>
              )}
            </Group>
          )}
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
                    <Stack key={r.link} align="center" spacing={0}>
                      <Indicator
                        disabled={!r.showStats}
                        label={r.stat}
                        size={18}
                        offset={1}
                        color="red"
                      >
                        <ActionIcon
                          onClick={r.onClick}
                          style={{ cursor: "pointer" }}
                          variant="subtle"
                          color={
                            r.link === router.pathname ? "primary" : "gray"
                          }
                        >
                          <r.icon />
                        </ActionIcon>
                      </Indicator>

                      <Text color="dimmed" fz="xs">
                        {r.label}
                      </Text>
                    </Stack>
                  ) : (
                    // When onClick is not a function (i.e., is false)
                    <Link
                      key={r.link}
                      href={r.link}
                      style={{ textDecoration: "none" }}
                    >
                      <Stack align="center" spacing={0}>
                        <Indicator
                          disabled={!r.showStats}
                          label={r.stat}
                          size={18}
                          offset={1}
                          color="red"
                        >
                          <ActionIcon
                            variant="subtle"
                            color={
                              r.link === router.pathname ? "primary" : "gray"
                            }
                          >
                            <r.icon />
                          </ActionIcon>
                        </Indicator>
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
            <Container />
          </Footer>
        )
      }
    >
      <Modal
        opened={opened}
        onClose={() => {
          if (isEmailConfirmed) setIsEmailConfirmed(false);
          if (isRedirectToLogin) setIsRedirectToLogin(false);
          if (isPasswordReset) setIsPasswordReset(false);
          if (isEmailConfirmed || isPasswordReset) {
            window.history.replaceState(null, "", "/");
          }
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
                  The next time you log in, please use your new password.
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
      {children}
    </AppShell>
  );
}
