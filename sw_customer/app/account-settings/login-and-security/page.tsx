"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
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
import ResetPasswordModal from "@/Components/ResetPasswordModal";
import DeleteAccountModal from "@/Components/DeleteAccountModal";

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    { title: "Login & Security", href: "/account-settings/login-and-security" },
  ].map((item, index) => (
    <Link key={index} href={item.href} legacyBehavior>
      <Anchor sx={(theme) => ({ color: "DimGray" })}>{item.title}</Anchor>
    </Link>
  ));

  const { data: session, update } = useSession();
  const user = session?.user;
  console.log(user);
  const userEmail = user?.email;
  const userPasswordResetAttempts =
    user?.customer?.password_reset_attempts || 0;

  const socialAccoiunts = user?.social_accounts;
  const isSocialAccountConnected = socialAccoiunts?.[0];

  const [modalMode, setModalMode] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  const handleModalClose = () => {
    setModalMode("");
    close();
    update();
  };

  return (
    <>
      <Box maw="600px">
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
              c={"cyan.7"}
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
                  You've signed up using a social login, so there's no need to
                  change your password.
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
          <Text mb={0}>Your account is connected to</Text>
          <Text mb={0}>
            {socialAccoiunts?.[0]
              ? socialAccoiunts[0].provider.charAt(0).toUpperCase() +
                socialAccoiunts[0].provider.slice(1)
              : ""}
          </Text>
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
          />
        )}

        {modalMode === "delete_account" && (
          <DeleteAccountModal
            isOpen={opened}
            onClose={handleModalClose} /*...otherProps*/
          />
        )}
      </Box>
    </>
  );
}
