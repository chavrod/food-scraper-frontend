import React from "react";
import Link from "next/link";
import { Stack, Title, Divider, Breadcrumbs, Anchor, Box } from "@mantine/core";

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    { title: "Personal Info", href: "/account-settings/personal-info" },
  ].map((item, index) => (
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
        <Title order={2}>Personal Info</Title>
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
