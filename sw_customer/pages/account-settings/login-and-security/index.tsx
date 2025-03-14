import Link from "next/link";
import React, { useState } from "react";
import { useAuthInfo } from "@/utils/auth/index";
import {
  Stack,
  Title,
  Text,
  Divider,
  Breadcrumbs,
  Anchor,
  Group,
  Box,
  Popover,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
// Internal: Components
import ResetPasswordModal from "@/Components/account/ResetPasswordModal";
import DeleteAccountModal from "@/Components/account/DeleteAccountModal";

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    { title: "Login & Security", href: "/account-settings/login-and-security" },
  ].map((item) => (
    <Link key={item.title} href={item.href} legacyBehavior>
      <Anchor sx={(theme) => ({ color: "DimGray" })}>{item.title}</Anchor>
    </Link>
  ));

  const { accessToken, user } = useAuthInfo();

  const refreshToken = session?.refresh_token || null;

  const userEmail = user?.email;
  const userPasswordResetAttempts =
    user?.customer?.password_reset_attempts || 0;

  const socialAccounts = user?.social_accounts;
  const isSocialAccountConnected = socialAccounts?.[0];

  const [modalMode, setModalMode] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  const handleModalClose = () => {
    setModalMode("");
    close();
  };

  return (
    <Box maw="600px" mt="md" px="lg">
      <Stack spacing={0} mb="lg">
        <Breadcrumbs separator="→" mt="xs">
          {items}
        </Breadcrumbs>
        <Title order={2}>Login & Security</Title>
      </Stack>
      <Divider size="sm" />

      <Title my="lg" order={4}>
        Login
      </Title>
      <Group position="apart" align="start" my="lg">
        <Text>
          <Text mb={0}>Password</Text>
        </Text>
        {!isSocialAccountConnected ? (
          <Text
            fz="lg"
            c="brand.7"
            fw={700}
            sx={{
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => {
              setModalMode("password_reset");
              open();
            }}
          >
            Update
          </Text>
        ) : (
          <Popover width={200} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Text
                fz="lg"
                c="grey"
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                fw={700}
              >
                Update
              </Text>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">
                You&apos;ve signed up using a social login, so there is no need
                to change your password.
              </Text>
            </Popover.Dropdown>
          </Popover>
        )}
      </Group>

      {/* <Text c="dimmed" mb="lg">
          Last updated:{" "}
        </Text> */}

      <Divider size="sm" />
      <Title my="lg" order={4}>
        Social accounts
      </Title>
      <Group my="lg" position="apart" align="start" mt="lg">
        {socialAccounts?.[0] ? (
          <>
            <Text mb={0}>Your account is connected to</Text>
            <Text mb={0}>
              {socialAccounts[0].provider.charAt(0).toUpperCase() +
                socialAccounts[0].provider.slice(1)}
            </Text>
          </>
        ) : (
          <Text mb={0}>Your account is not connected to a social account</Text>
        )}
      </Group>
      <Divider size="sm" />

      <Group my="lg" position="apart" align="start" mt="lg">
        <Title order={4}>Account</Title>
        <Text
          fz="lg"
          c="red.7"
          fw={700}
          sx={{
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          onClick={() => {
            setModalMode("delete_account");
            open();
          }}
        >
          Delete Account
        </Text>
      </Group>

      {modalMode === "password_reset" && !isSocialAccountConnected && (
        <ResetPasswordModal
          isOpen={opened}
          onClose={handleModalClose}
          userEmail={userEmail}
          userPasswordResetAttempts={userPasswordResetAttempts}
          accressToken={accressToken}
        />
      )}

      {modalMode === "delete_account" && (
        <DeleteAccountModal
          isOpen={opened}
          onClose={handleModalClose}
          accressToken={accressToken}
          refreshToken={refreshToken}
        />
      )}
    </Box>
  );
}
