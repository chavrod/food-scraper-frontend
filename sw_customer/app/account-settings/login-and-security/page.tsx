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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
// Internal: Utils
import { getCSRF } from "@/utils/getCSRF";

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

  const sendPasswordResetEmail = async () => {
    try {
      if (!userEmail) return;

      const csrfToken = await getCSRF();
      if (!csrfToken) return;

      setLoading(true);

      console.log("csrfToken: ", csrfToken);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/password-reset/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      if (response.ok) {
        setLoading(false);
      } else {
        console.log("OTHER ERROR! ");
      }
    } catch (error: any) {
      setLoading(false);
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Unknown error. Please try again later.",
        color: "red",
      });
    }
  };

  return (
    <Box maw="600px">
      <Modal
        opened={opened}
        onClose={close}
        title={modalMode === "password_reset" ? "Reset Password" : ""}
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to{" "}
            {modalMode === "password_reset" ? "reset password" : ""}?
          </Text>
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

// const ResetPassword = () => {
//   const [email, setEmail] = useState("");

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     const response = await fetch("/password_reset/", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ email }),
//     });
//     if (response.ok) {
//       // Handle success - maybe navigate user to a success page or show a message.
//     } else {
//       // Handle error
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         placeholder="Enter your email"
//         required
//       />
//       <button type="submit">Reset Password</button>
//     </form>
//   );
// };

// export default ResetPassword;
