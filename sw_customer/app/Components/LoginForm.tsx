"use client";
import { useState } from "react";

import { signIn } from "next-auth/react";

import { TextInput, Text, Button, Stack, Center, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCircleCheckFilled } from "@tabler/icons-react";

interface LoginFormProps {
  handleLoginSucess: () => void;
  isLoginSuccess: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  handleLoginSucess,
  isLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) =>
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
          ? "Invalid email."
          : null,
      password: (value) =>
        value.trim().length === 0 ? "Password is required." : null,
    },
  });

  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);

      const { email, password } = form.values;

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setIsLoading(false);

      if (result && result.error) {
        setError(result.error);
      } else {
        handleLoginSucess();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {!isLoginSuccess ? (
        <div>
          <form onSubmit={form.onSubmit(handleFormSubmit)}>
            <TextInput
              id="login_email"
              label="Email"
              placeholder="Your email address"
              required
              {...form.getInputProps("email")}
              disabled={isLoading}
            />
            <TextInput
              id="login_password"
              label="Password"
              type="password"
              placeholder="Your password"
              required
              style={{ marginTop: 15 }}
              {...form.getInputProps("password")}
              disabled={isLoading}
            />
            {error && (
              <Text size="sm" color="red" mt="md">
                {error}
              </Text>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              style={{ marginTop: 20 }}
              fullWidth
            >
              Login
            </Button>
          </form>
        </div>
      ) : (
        <Center>
          <Stack
            justify="center"
            style={{ textAlign: "center" }}
            align="center"
          >
            <IconCircleCheckFilled
              size={80}
              style={{ color: "green", marginBottom: "10px" }}
            />
            <Title align="center" order={2}>
              You're Logged in!
            </Title>
          </Stack>
        </Center>
      )}
    </>
  );
};

export default LoginForm;
