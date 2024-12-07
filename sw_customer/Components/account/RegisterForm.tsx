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
// Internal: Utils
import getCSRF from "@/utils/getCSRF";
import { signUp } from "@/utils/auth/index";

function PasswordRequirement({
  meets,
  label,
}: {
  meets: boolean;
  label: string;
}) {
  return (
    <Text
      color={meets ? "teal" : "red"}
      sx={{ display: "flex", alignItems: "center" }}
      mt={7}
      size="sm"
    >
      {meets ? <IconCheck size="0.9rem" /> : <IconX size="0.9rem" />}{" "}
      <Box ml={10}>{label}</Box>
    </Text>
  );
}

const requirements = [
  { re: /[0-9]/, label: "Includes number" },
  { re: /[a-z]/, label: "Includes lowercase letter" },
  { re: /[A-Z]/, label: "Includes uppercase letter" },
  { re: /[!@#$%^&*]/, label: "Includes special symbol from !@#$%^&*" },
  // TODO: Add this, but logic must be flipped
  // {
  //   re: /(.)\1{3,}/,
  //   label: "No repeated characters in sequence four times or more",
  // },
];

function getStrength(password: string) {
  let multiplier = password.length > 5 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

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

      const msg = await signUp({ email, password: password1 });

      if (msg.status == 400) {
        form.setErrors(msg.data);
        // 401 indicates that email verificaiton is required
      } else if (msg.status == 401) {
        handleRegistrationSubmission();
        setEmailVerificationToResend(email);
      } else {
        throw new Error(msg.data);
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

  // Password strength logic
  const [popoverOpened, setPopoverOpened] = useState(false);
  const checks = requirements.map((requirement, index) => (
    <PasswordRequirement
      key={index}
      label={requirement.label}
      meets={requirement.re.test(form.values.password1)}
    />
  ));
  const strength = getStrength(form.values.password1);
  const color = strength === 100 ? "teal" : strength > 50 ? "yellow" : "red";

  // Email resneding logic
  const [isEmailResend, setIsEmailResend] = useState(false);

  const resendEmail = async () => {
    try {
      if (!emailVerificationToResend) return;

      const csrfToken = await getCSRF();
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
          <Box>
            <Popover
              opened={popoverOpened}
              position="bottom"
              width="target"
              transitionProps={{ transition: "pop" }}
            >
              <Popover.Target>
                <div
                  onFocusCapture={() => setPopoverOpened(true)}
                  onBlurCapture={() => setPopoverOpened(false)}
                >
                  <PasswordInput
                    id="p1"
                    label="Password"
                    placeholder="Your password"
                    required
                    style={{ marginTop: 15 }}
                    {...form.getInputProps("password1")}
                    disabled={isLoading}
                    visible={visible}
                    onVisibilityChange={toggle}
                  />
                </div>
              </Popover.Target>
              <Popover.Dropdown>
                <Progress color={color} value={strength} size={5} mb="xs" />
                <PasswordRequirement
                  label="Includes at least 8 characters"
                  meets={form.values.password1.length > 7}
                />
                {checks}
              </Popover.Dropdown>
            </Popover>
          </Box>
          <PasswordInput
            id="p2"
            label="Repeat Password"
            placeholder="Repeat your password"
            required
            style={{ marginTop: 15 }}
            {...form.getInputProps("password2")}
            disabled={isLoading}
            visible={visible}
            onVisibilityChange={toggle}
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
