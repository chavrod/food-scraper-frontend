"use-client";

import { useState } from "react";
import {
  TextInput,
  Button,
  Center,
  Stack,
  Text,
  Title,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useInterval } from "@mantine/hooks";

interface RegisterFormProps {
  isRegistrationSubmitted: boolean;
  handleRegistrationSubmission: () => void;
  handleMoveToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  isRegistrationSubmitted,
  handleRegistrationSubmission,
  handleMoveToLogin,
}) => {
  const form = useForm({
    initialValues: {
      email: "",
      username: "",
      password1: "",
      password2: "", // repeat password
    },
    validate: {
      email: (value) =>
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
          ? "Invalid email."
          : null,
      password1: (value) =>
        value.trim().length === 0 ? "Password is required." : null,
      password2: (value, values) =>
        value !== values.password1 ? "Passwords must match." : null,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const [countdown, setCountdown] = useState<number>(60);

  const intervalToResendEmail = useInterval(
    () => {
      if (countdown > 0) {
        setCountdown((prev) => prev - 1);
      }
    },
    countdown > 0 ? 1000 : 0
  );

  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);

      const { email, password1, password2 } = form.values;
      const username = email;

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            username,
            password1,
            password2,
          }),
        }
      );
      const data = await response.json();

      // TODO: Handle non-field errors

      if (!response.ok) {
        form.setErrors(data);
      } else {
        handleRegistrationSubmission();
        intervalToResendEmail.start;
      }
      setIsLoading(false);
    } catch (error) {
      console.log("helooo");
      setIsLoading(false);
    }

    // Handle the response data as required (e.g., show a success message or error message)
  };

  const resendEmail = async () => {
    setCountdown(60);
  };

  return (
    <>
      {!isRegistrationSubmitted ? (
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
          <TextInput
            id="email"
            label="Email"
            placeholder="Your email address"
            required
            {...form.getInputProps("email")}
            disabled={isLoading}
          />
          <TextInput
            id="p1"
            label="Password"
            type="password"
            placeholder="Your password"
            required
            style={{ marginTop: 15 }}
            {...form.getInputProps("password1")}
            disabled={isLoading}
          />
          <TextInput
            id="p2"
            label="Repeat Password"
            type="password"
            placeholder="Repeat your password"
            required
            style={{ marginTop: 15 }}
            {...form.getInputProps("password2")}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            style={{ marginTop: 20 }}
            fullWidth
          >
            Register
          </Button>
        </form>
      ) : (
        // Email verification message UI
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
              You're registered!
            </Title>
            <Text align="center">
              We've sent a confirmation email to{" "}
              <strong>{form.values.email}</strong>. Please head to your inbox to
              verify your email.
            </Text>
            {countdown > 0 && (
              <Group>
                <Text align="center">
                  {"If you didn't get the email, you can "}
                  <span
                    style={{
                      color: "blue",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Logic to resend email goes here...
                      setCountdown(60); // reset countdown after sending email
                    }}
                  >
                    send another one
                  </span>{" "}
                  in
                  <strong> {countdown}</strong>
                  {" seconds."}
                </Text>
              </Group>
            )}
            <Button variant="outline" onClick={handleMoveToLogin} fullWidth>
              Go to Login
            </Button>
          </Stack>
        </Center>
      )}
    </>
  );
};

export default RegisterForm;
