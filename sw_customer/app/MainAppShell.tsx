"use client";

// React / Next
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
// External
import {
  AppShell,
  Navbar,
  Header,
  Text,
  Group,
  Footer,
  NavLink,
  ActionIcon,
  Container,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  Icon,
  IconHome2,
  IconSearch,
  IconCalculator,
  IconChartHistogram,
} from "@tabler/icons-react";
// Internal
import ThemeToggle from "./ThemeToggle";

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
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

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
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
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
            <Text>Food Saver</Text>
            <ThemeToggle />
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
      {children}
    </AppShell>
  );
}