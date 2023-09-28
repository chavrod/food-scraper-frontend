"use client";

// React / Next
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Button,
  Text,
  Stack,
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import {
  Icon,
  IconHome2,
  IconSearch,
  IconCalculator,
  IconChartHistogram,
  IconUserCircle,
} from "@tabler/icons-react";
import { useSession, signOut } from "next-auth/react";
// Internal
import LoginForm from "./Components/Login";
import RegisterForm from "./Components/Register";

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
  const [opened, { open, close }] = useDisclosure(false);
  const [isRegister, setIsRegister] = useState(false);

  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  const router = useRouter();
  const { data: session, status } = useSession();

  console.log(session, status);

  const routes: Route[] = [
    {
      link: "/",
      label: "Home",
      icon: IconHome2,
      footer: true,
      navbar: true,
      isLoggedInVisible: true,
      isLoggedOutVisible: false,
      onClick: false,
    },
    {
      link: "/search",
      label: "Explore",
      icon: IconSearch,
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
        setIsRegister(false);
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
              <img
                src="/shopping_wiz_logo.png"
                alt="Shopping Wiz logo"
                style={{ maxWidth: "9rem" }}
              />
            </Group>
            <Group>
              {session ? (
                <Button onClick={() => signOut()}>Log out</Button>
              ) : (
                <Group>
                  <Button
                    onClick={() => {
                      open();
                      setIsRegister(true);
                    }}
                  >
                    Register
                  </Button>
                  <Button
                    onClick={() => {
                      open();
                      setIsRegister(false);
                    }}
                  >
                    Log in
                  </Button>
                </Group>
              )}
            </Group>
          </Group>
        </Header>
      }
      footer={
        isClient && !isLargerThanSm ? (
          <Footer height={70} p="md">
            <Group
              position={session ? "apart" : "center"}
              spacing={!session ? "xl" : ""}
            >
              {routes
                .filter((r) => r.footer)
                .filter((r) =>
                  session ? r.isLoggedInVisible : r.isLoggedOutVisible
                )
                .map((r, i) => (
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
                ))}
            </Group>
          </Footer>
        ) : (
          <Footer height={0}>
            <Container></Container>
          </Footer>
        )
      }
    >
      <Modal opened={opened} onClose={close} title="Log in or sign up" centered>
        {isRegister ? (
          <RegisterForm handleMoveToLogin={() => setIsRegister(false)} />
        ) : (
          <LoginForm handleLoginSucess={handleLoginSucess} />
        )}
      </Modal>
      {children}
    </AppShell>
  );
}
