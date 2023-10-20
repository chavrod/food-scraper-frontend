"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function SecurityPage() {
  const items = [
    { title: "Account", href: "/account-settings" },
    { title: "Login & Security", href: "/account-settings/login-and-security" },
  ].map((item, index) => (
    <Link key={index} href={item.href} legacyBehavior>
      <Anchor sx={(theme) => ({ color: "DimGray" })}>{item.title}</Anchor>
    </Link>
  ));

  const [visible, { toggle }] = useDisclosure(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoadingPasswordReset, setIsLoadingPasswordReset] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);

  // const form = useForm({
  //   initialValues: {
  //     oldPassword: "",
  //     password1: "",
  //     password2: "", // repeat password
  //   },
  //   validate: {
  //     oldPassword: (value) =>
  //       value.trim().length === 0 ? "Password is required." : null,
  //     password1: (value) =>
  //       value.trim().length === 0 ? "Password is required." : null,
  //     password2: (value, values) =>
  //       value !== values.password1 ? "Passwords must match." : null,
  //   },
  // });

  // const handleFormSubmit = async () => {
  //   try {
  //     setIsLoadingPasswordReset(true);
  //     const { oldPassword, password1, password2 } = form.values;
  //     // const username = email.includes("@") ? email.split("@")[0] : email;
  //     // const response = await fetch(
  //     //   process.env.NEXT_PUBLIC_API_URL + "auth/register/",
  //     //   {
  //     //     method: "POST",
  //     //     headers: {
  //     //       "Content-Type": "application/json",
  //     //     },
  //     //     body: JSON.stringify({
  //     //       email,
  //     //       username,
  //     //       password1,
  //     //       password2,
  //     //     }),
  //     //   }
  //     // );
  //     // const data = await response.json();
  //     // // TODO: Handle non-field errors
  //     // if (!response.ok) {
  //     //   form.setErrors(data);
  //     // } else {
  //     // }
  //     setIsLoadingPasswordReset(false);
  //   } catch (error: any) {
  //     setIsLoadingPasswordReset(false);
  //     notifications.show({
  //       title: "Server Error!",
  //       message: error?.message || "Unknown error. Please try again later.",
  //       color: "red",
  //     });
  //   }
  // };

  return (
    <Box maw="600px">
      <Modal opened={opened} onClose={close} title="Authentication">
        <Stack>
          <Text>Are you sure you want to remove this payment method?</Text>
          <Group grow>
            <Button
              variant="light"
              onClick={() => {
                close;
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => {}}>Send Email</Button>
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
          onClick={open}
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
