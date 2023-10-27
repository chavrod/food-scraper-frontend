"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Stack,
  Title,
  Text,
  Grid,
  Paper,
  Divider,
  Breadcrumbs,
  Anchor,
  Group,
  Flex,
  Box,
  PasswordInput,
  Button,
  Modal,
  Space,
  List,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCircleCheck,
  IconAlertTriangleFilled,
  IconHelpHexagonFilled,
  IconCircleCheckFilled,
} from "@tabler/icons-react";

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    { title: "Login & Security", href: "/account-settings/login-and-security" },
  ].map((item, index) => (
    <Link key={index} href={item.href} legacyBehavior>
      <Anchor sx={(theme) => ({ color: "DimGray" })}>{item.title}</Anchor>
    </Link>
  ));

  const { data: session } = useSession();
  const userEmail = session?.user.email;

  const [visible, { toggle }] = useDisclosure(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoadingPasswordReset, setIsLoadingPasswordReset] = useState(false);

  const [modalMode, setModalMode] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  const [loading, setLoading] = useState(false);

  const [
    showPasswordResetEmailConfirmation,
    setShowPasswordResetEmailConfirmation,
  ] = useState(false);

  const sendPasswordResetEmail = async () => {
    try {
      if (!userEmail) return;

      setLoading(true);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/password-reset/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      if (response.ok) {
        setLoading(false);
        setShowPasswordResetEmailConfirmation(true);
      } else {
        setLoading(false);
        notifications.show({
          title: "Server Error!",
          message: "Please try again later or contact support.",
          color: "red",
        });
      }
    } catch (error: any) {
      setLoading(false);
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Please try again later or contact support.",
        color: "red",
      });
    }
  };

  return (
    <Box maw="600px">
      <Modal
        opened={opened}
        onClose={() => {
          close();
          if (showPasswordResetEmailConfirmation)
            setShowPasswordResetEmailConfirmation(false);
        }}
        title={modalMode === "password_reset" ? "Reset Password" : ""}
        centered
      >
        <Stack>
          <Text>
            {modalMode === "password_reset" ? (
              <Paper
                p="md"
                radius="sm"
                style={{ maxWidth: "400px", margin: "0 auto" }}
              >
                {showPasswordResetEmailConfirmation ? (
                  <Stack
                    justify="center"
                    style={{ textAlign: "center" }}
                    align="center"
                  >
                    <IconCircleCheckFilled
                      size={80}
                      style={{ color: "green", marginBottom: "10px" }}
                    />
                    <Text align="center">
                      We've sent a password reset email to{" "}
                      <strong>{userEmail}</strong>. Please head to your inbox.
                    </Text>
                  </Stack>
                ) : (
                  <>
                    <Text>Please note the following:</Text>
                    <Space h="md" />
                    <List spacing="md" size="sm" center>
                      <List.Item
                        icon={
                          <ThemeIcon color="teal" size={24} radius="xl">
                            <IconCircleCheck size="1rem" />
                          </ThemeIcon>
                        }
                      >
                        After successfully changing your password, you will
                        remain logged in.
                      </List.Item>
                      <List.Item
                        icon={
                          <ThemeIcon color="yellow" size={24} radius="xl">
                            <IconAlertTriangleFilled size="1rem" />
                          </ThemeIcon>
                        }
                      >
                        You can only send X password change emails per day. Your
                        current usage is X/X.
                      </List.Item>
                      <List.Item
                        icon={
                          <ThemeIcon color="blue" size={24} radius="xl">
                            <IconHelpHexagonFilled size="1rem" />
                          </ThemeIcon>
                        }
                      >
                        If you encounter any issues, please contact support.
                      </List.Item>
                    </List>
                    <Space h="md" />
                    <Text ta="center">
                      Confirm you want to send a password reset email to{" "}
                      <strong>{userEmail}</strong>.
                    </Text>
                  </>
                )}
              </Paper>
            ) : null}
          </Text>
          {!showPasswordResetEmailConfirmation && (
            <Group grow>
              <Button
                variant="light"
                disabled={loading}
                onClick={() => {
                  close();
                }}
              >
                Cancel
              </Button>
              <Button
                loading={loading}
                onClick={() => {
                  if (modalMode === "password_reset") {
                    sendPasswordResetEmail();
                  } else {
                    return;
                  }
                }}
              >
                {modalMode === "password_reset" ? "Send Email" : ""}
              </Button>
            </Group>
          )}
        </Stack>
      </Modal>

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
      <Stack>
        <h1>Account</h1>
        <p>Deactivate your account</p>
      </Stack>
    </Box>
  );
}
