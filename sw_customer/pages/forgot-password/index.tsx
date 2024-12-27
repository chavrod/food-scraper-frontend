import React, { useState } from "react";

import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Paper, TextInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
// Internal: Utils
import getClientSideCSRF from "@/utils/getCSRF";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [opened, { open, close }] = useDisclosure(true);

  const [isLoading, setIsLoading] = useState(false);
  const [
    showPasswordResetEmailConfirmation,
    setShowPasswordResetEmailConfirmation,
  ] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      // eslint-disable-next-line no-confusing-arrow
      email: (value) =>
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
          ? "Invalid email."
          : null,
    },
  });

  const handleFormSubmit = async () => {
    try {
      const { email } = form.values;
      if (!email) return;

      const csrfToken = await getClientSideCSRF();
      if (!csrfToken) return;

      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}auth/password-reset/`,
        {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );
      if (response.ok) {
        setIsLoading(false);
        setShowPasswordResetEmailConfirmation(true);
      } else {
        setIsLoading(false);
        notifications.show({
          title: "Server Error!",
          message: "Please try again later or contact support.",
          color: "red",
        });
      }
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Please try again later or contact support.",
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      fullScreen
      transitionProps={{ transition: "fade", duration: 200 }}
      withCloseButton={false}
    >
      <Stack
        align="center"
        justify="center"
        style={{ height: "calc(100vh - 130px)" }}
      >
        <Paper
          radius="md"
          p="md"
          sx={(theme) => ({
            backgroundColor: "#f5f5f5",
            [theme.fn.largerThan("sm")]: { width: "400px" },
          })}
        >
          {!showPasswordResetEmailConfirmation ? (
            <form onSubmit={form.onSubmit(handleFormSubmit)}>
              <TextInput
                id="login_email"
                label="Forgot Password?"
                description="Enter your email and we'll send you a reset link"
                placeholder="Your email address"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...form.getInputProps("email")}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                style={{ marginTop: 20 }}
                fullWidth
              >
                Request Password Reset
              </Button>
            </form>
          ) : (
            <Stack
              justify="center"
              style={{ textAlign: "center" }}
              align="center"
            >
              <IconCircleCheckFilled size={80} style={{ color: "green" }} />
              <Text align="center">
                We have sent a password reset email to{" "}
                <strong>{form.values.email}</strong>. Please head to your inbox.
              </Text>
            </Stack>
          )}
          <Link href="/?login=open" legacyBehavior>
            <Button variant="outline" fullWidth mt="xs">
              Go to Login
            </Button>
          </Link>
        </Paper>
      </Stack>
    </Modal>
  );
}
