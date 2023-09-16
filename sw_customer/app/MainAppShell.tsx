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
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import {
  Icon,
  IconHome2,
  IconSearch,
  IconCalculator,
  IconChartHistogram,
} from "@tabler/icons-react";
import { signIn, useSession, signOut } from "next-auth/react";
// Internal
import LoginForm from "./Components/Login";
import RegisterForm from "./Components/Register";

interface Route {
  link: string;
  label: string;
  icon: Icon;
  footer: boolean;
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
    { link: "/", label: "Home", icon: IconHome2, footer: true },
    { link: "/search", label: "Search", icon: IconSearch, footer: true },
    {
      link: "/estimate",
      label: "Estimate",
      icon: IconCalculator,
      footer: true,
    },
    { link: "/track", label: "Track", icon: IconChartHistogram, footer: true },
  ];

  useEffect(() => {
    // Once the component mounts on the client side, set isClient to true
    setIsClient(true);
  }, []);

  const isLargerThanSm = useMediaQuery("(min-width: 768px)");

  return (
    <AppShell
      styles={(theme) => ({})}
      navbar={
        isClient && isLargerThanSm ? (
          <Navbar width={{ base: 300 }} p="xs">
            {routes.map((r, i) => (
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
          <Group position="apart">
            <Group>
              <img
                src="/shopping_wiz_logo.png"
                alt="Shopping Wiz logo"
                style={{ maxWidth: "10rem" }}
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
          <Footer height={60} p="md">
            <Group position="apart">
              {routes
                .filter((r) => r.footer)
                .map((r, i) => (
                  <Link
                    key={i}
                    href={r.link}
                    style={{ textDecoration: "none" }}
                  >
                    <ActionIcon
                      variant="subtle"
                      color={r.link === pathname ? "primary" : "gray"}
                    >
                      <r.icon />
                    </ActionIcon>
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
        {isRegister ? <RegisterForm /> : <LoginForm />}
      </Modal>
      {children}
    </AppShell>
  );
}
