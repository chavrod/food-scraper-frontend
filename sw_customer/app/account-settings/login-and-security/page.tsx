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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
// Internal: Components
import ResetPasswordModal from "@/app/Components/ResetPasswordModal";
import DeleteAccountModal from "@/app/Components/DeleteAccountModal";

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
  const userEmail = user?.email;
  const userPasswordResetAttempts =
    user?.customer?.password_reset_attempts || 0;

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
        <Group position="apart" align="start" mt="lg">
          <Text>
            <Text mb={0}>Password</Text>
          </Text>
          <Text
            fz="lg"
            c="cyan.7"
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
        </Group>

        <Text c="dimmed" mb="lg">
          Last updated:{" "}
        </Text>

        <Divider size="sm" />
        <Stack>
          <h1>Social accounts</h1>
          <p>Show the connection to</p>
        </Stack>
        <Divider size="sm" />
        <Title my="lg" order={4}>
          Account
        </Title>
        <Group position="apart" align="start" mt="lg">
          <Text>
            <Text mb={0}>Password</Text>
          </Text>
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

        {modalMode === "password_reset" && (
          <ResetPasswordModal
            isOpen={opened}
            onClose={handleModalClose}
            update={update}
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
