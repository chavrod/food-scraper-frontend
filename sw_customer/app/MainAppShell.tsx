"use client";

// React / Next
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// External
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
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
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
} from "@tabler/icons-react";
import { useSession, signOut } from "next-auth/react";
// Internal: Components
import UserAccess from "../Components/UserAccess";
// Internal: Utils
import { logout } from "@/utils/auth";

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

export default function MainAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const loginParams = useSearchParams();
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(
    loginParams.get("login") === "successful-email-confirmation"
  );
  const [isPasswordReset, setIsPasswordReset] = useState(
    loginParams.get("password-reset") === "successful-password-reset"
  );
  const [isRedirectToLogin, setIsRedirectToLogin] = useState(
    loginParams.get("login") === "open"
  );
  const [callBackUrl, setCallBackUrl] = useState(
    loginParams.get("callbackUrl")
  );

  const router = useRouter();

  const [opened, { open, close }] = useDisclosure(false);

  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  const { data: session } = useSession();

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
    // Once the component mounts on the client side, set isClient to true
    setIsClient(true);
  }, []);

  const isLargerThanSm = useMediaQuery("(min-width: 768px)");

  const handleLoginSucess = () => {
    close();

    if (callBackUrl) {
      const decodedCallbackUrl = decodeURIComponent(callBackUrl);

      router.push(decodedCallbackUrl);
    }
  };

  return (
    <AppShell
      styles={(theme) => ({})}
      navbar={
        isClient && isLargerThanSm ? (
          <Navbar width={{ base: 300 }} p="xs">
            {routes
              .filter((r) => r.navbar)
              .map((r, i) => (
                <Link key={i} href={r.link} style={{ textDecoration: "none" }}>
                  <NavLink
                    my={4}
                    key={i}
                    label={r.label}
                    icon={<r.icon size="1.5rem" stroke={1.5} />}
                    active={r.link === pathname}
                    variant="filled"
                  ></NavLink>
                </Link>
              ))}
          </Navbar>
        ) : (
          <></>
        )
      }
      header={
        <Header height={60} p="xs">
          <Group position="apart" spacing="xs" noWrap>
            <Group>
              <Link href="/">
                <img
                  src="/shopping_wiz_logo.png"
                  alt="Shopping Wiz logo"
                  style={{ maxWidth: "9rem" }}
                />
              </Link>
            </Group>
            <Group>
              {isClient ? (
                <Menu shadow="md" width={200} position="bottom-end" offset={3}>
                  <Menu.Target>
                    <Avatar color={session ? "cyan" : "gray"} radius="xl">
                      {session && session.user.username.length > 2 ? (
                        session.user.username.slice(0, 2).toUpperCase()
                      ) : (
                        <IconUserCircle size="1.8rem" stroke="0.09rem" />
                      )}
                    </Avatar>
                  </Menu.Target>

                  <Menu.Dropdown>
                    {session ? (
                      <>
                        {" "}
                        <Menu.Label>{session.user.email}</Menu.Label>
                        <Menu.Item icon={<IconLifebuoy size={14} />}>
                          Help
                        </Menu.Item>
                        <Menu.Item icon={<IconSettings size={14} />}>
                          <Link
                            href="/account-settings"
                            style={{ textDecoration: "none", color: "black" }}
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
                      </>
                    ) : (
                      <>
                        {" "}
                        <Menu.Item
                          onClick={() => open()}
                          icon={<IconLogin size={14} />}
                        >
                          Log in
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item icon={<IconLifebuoy size={14} />}>
                          Help
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <>
                  <Avatar color={"gray"} radius="xl">
                    <IconUserCircle size="1.8rem" stroke="0.09rem" />
                  </Avatar>
                </>
              )}
            </Group>
          </Group>
        </Header>
      }
      footer={
        isClient && !isLargerThanSm ? (
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
                        color={r.link === pathname ? "primary" : "gray"}
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
                          color={r.link === pathname ? "primary" : "gray"}
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
          opened || isEmailConfirmed || isPasswordReset || isRedirectToLogin
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
