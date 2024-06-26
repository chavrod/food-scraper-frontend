import React from "react";
import Link from "next/link";
import { Stack, Title, Divider, Breadcrumbs, Anchor, Box } from "@mantine/core";

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    {
      title: "Privacy & Sharing",
      href: "/account-settings/privacy-and-sharing",
    },
  ].map((item) => (
    <Link key={item.title} href={item.href} legacyBehavior>
      <Anchor sx={(theme) => ({ color: "DimGray" })}>{item.title}</Anchor>
    </Link>
  ));

  return (
    <Box maw="600px" mt="md" px="lg">
      <Stack spacing={0} mb="lg">
        <Breadcrumbs separator="→" mt="xs">
          {items}
        </Breadcrumbs>
        <Title order={2}>Privacy & Sharing</Title>
      </Stack>
      <Divider size="sm" />

      <div>
        <Title order={3} mt="xl">
          Coming soon...
        </Title>
      </div>
    </Box>
  );
}
