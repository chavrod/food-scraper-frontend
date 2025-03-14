import React, { PropsWithChildren, useState } from "react";
import Link from "next/link";

import { Stack, Title, Text, Grid, Paper } from "@mantine/core";
import { IconEye, IconId, IconShield } from "@tabler/icons-react";

import { useAuthInfo } from "@/utils/auth/index";

interface AccountSettingsMainMenuCardProps extends PropsWithChildren {
  href: string;
}

function AccountSettingsMainMenuCard({
  href,
  ...props
}: AccountSettingsMainMenuCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
  };

  const handleRelease = () => {
    setIsPressed(false);
  };

  return (
    <Link href={href} legacyBehavior>
      <Paper
        className={`touchable-card ${isPressed ? "pressed" : ""}`}
        h="100%"
        shadow="lg"
        withBorder
        p="lg"
        radius="lg"
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        style={{ cursor: "pointer" }}
        sx={(theme) => ({
          width: "320px",
          [theme.fn.smallerThan("xs")]: { width: "auto" },
        })}
      >
        {props.children}
      </Paper>
    </Link>
  );
}

export default function EstimatePage() {
  const { user } = useAuthInfo();

  return (
    <div>
      <Stack spacing="xs" mb={80} mt="md" px="lg">
        <Title order={2}>Account Settings</Title>
        <Text mb="lg">{user?.email}</Text>
        <Grid
          maw="1050px"
          sx={(theme) => ({
            [theme.fn.smallerThan("xl")]: { maxWidth: "700px" },
          })}
        >
          <Grid.Col span={12} md={6} xl={4}>
            <AccountSettingsMainMenuCard href="/account-settings/personal-info">
              <Stack spacing="xl" align="flex-start" justify="space-between">
                <IconId size={35} />
                <Stack spacing={0} align="flex-start" justify="flex-end">
                  <Title order={4}>Personal info</Title>
                  <Text fz="sm" c="dimmed">
                    Edit personal details
                  </Text>
                </Stack>
              </Stack>
            </AccountSettingsMainMenuCard>
          </Grid.Col>
          <Grid.Col span={12} md={6} xl={4}>
            <AccountSettingsMainMenuCard href="/account-settings/login-and-security">
              <Stack spacing="xl" align="flex-start" justify="space-between">
                <IconShield size={35} />
                <Stack spacing={0} align="flex-start" justify="flex-end">
                  <Title order={4}>Login & Security</Title>
                  <Text fz="sm" c="dimmed">
                    Update your password
                  </Text>
                </Stack>
              </Stack>
            </AccountSettingsMainMenuCard>
          </Grid.Col>
          <Grid.Col span={12} md={6} xl={4}>
            <AccountSettingsMainMenuCard href="/account-settings/privacy-and-sharing">
              <Stack spacing="xl" align="flex-start" justify="space-between">
                <IconEye size={35} />
                <Stack spacing={0} align="flex-start" justify="flex-end">
                  <Title order={4}>Privacy & Sharing</Title>
                  <Text fz="sm" c="dimmed">
                    Manage your personal data
                  </Text>
                </Stack>
              </Stack>
            </AccountSettingsMainMenuCard>
          </Grid.Col>
        </Grid>
      </Stack>
    </div>
  );
}
