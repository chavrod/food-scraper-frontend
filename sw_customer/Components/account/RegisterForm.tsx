import React, { useState } from "react";
import {
  TextInput,
  Button,
  Center,
  Stack,
  Text,
  Title,
  Anchor,
  PasswordInput,
  Progress,
  Popover,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconCircleCheckFilled, IconX, IconCheck } from "@tabler/icons-react";

import getClientSideCSRF from "@/utils/getCSRF";
import { signUp, formatAuthErrors } from "@/utils/auth/index";
import PasswordStrengthInput from "./PasswordStrengthInput";

interface RegisterFormProps {
  isRegistrationSubmitted: boolean;
  handleRegistrationSubmission: () => void;
  handleMoveToLogin: () => void;
}

function RegisterForm({
  isRegistrationSubmitted,
  handleRegistrationSubmission,
  handleMoveToLogin,
}: RegisterFormProps) {
  const [visible, { toggle }] = useDisclosure(false);

  const [isLoading, setIsLoading] = useState(false);

  const [emailVerificationToResend, setEmailVerificationToResend] =
    useState("");

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

  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);

      const { email, password1 } = form.values;

      const res = await signUp({ email, password: password1 });

      console.log("SIGNUP RES: ", res);

      if (res.status === 400) {
        form.setErrors(formatAuthErrors(res.errors, { password: "password1" }));
        // 401 indicates that email verificaiton is required
      } else if (res.status == 401) {
        handleRegistrationSubmission();
        setEmailVerificationToResend(email);
      } else {
        throw new Error(res.errors[0].message);
      }
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Unknown error. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }

    // Handle the response data as required (e.g., show a success message or error message)
  };

  // Email resneding logic
  const [isEmailResend, setIsEmailResend] = useState(false);

  const resendEmail = async () => {
    try {
      if (!emailVerificationToResend) return;

      const csrfToken = await getClientSideCSRF();
      if (!csrfToken) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}auth/send-validation-email/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailVerificationToResend,
          }),
        }
      );

      if (response.ok) setIsEmailResend(true);
    } catch (error: any) {
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Unknown error. Please try again later.",
        color: "red",
      });
    }
  };

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
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
          <PasswordStrengthInput
            form={form}
            isLoading={isLoading}
            visible={visible}
            toggle={toggle}
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
              You are registered!
            </Title>
            <Text align="center">
              We have sent a confirmation email to{" "}
              <strong>{form.values.email}</strong>. Please head to your inbox to
              verify.
            </Text>

            {!isEmailResend ? (
              <Text align="center">
                Didn&apos;t get the email?{" "}
                <Anchor component="button" onClick={resendEmail} type="button">
                  Resend Activation Email
                </Anchor>
              </Text>
            ) : (
              <Text align="center">
                We&apos;ve just sent you another email. If you still didn&apos;t
                receive it, please contact us at{" "}
                <strong>help@shop-wiz.ie</strong>.
              </Text>
            )}

            <Button variant="outline" onClick={handleMoveToLogin} fullWidth>
              Go to Login
            </Button>
          </Stack>
        </Center>
      )}
    </>
  );
}

export default RegisterForm;
