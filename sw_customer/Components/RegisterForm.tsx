import { useState } from "react";
import {
  TextInput,
  Button,
  Center,
  Stack,
  Text,
  Title,
  Anchor,
  PasswordInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { IconCircleCheckFilled } from "@tabler/icons-react";
// Internal: Utils
import { getCSRF } from "@/utils/getCSRF";

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
  const [visible, { toggle }] = useDisclosure(false);

  const [isLoading, setIsLoading] = useState(false);

  const [emailVerificationToResend, setEmailVerificationToResend] =
    useState("");

  const handleFormSubmit = async () => {
    try {
      setIsLoading(true);

      const { email, password1, password2 } = form.values;
      const username = email.includes("@") ? email.split("@")[0] : email;

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
        setEmailVerificationToResend(email);
      }
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        title: "Server Error!",
        message: error?.message || "Unknown error. Please try again later.",
        color: "red",
      });
    }

    // Handle the response data as required (e.g., show a success message or error message)
  };

  // TODO: Password strength Meter
  // const [passwordStrength, setPasswordStrength] = useState<number>(0);

  // const requirements = [
  //   { re: /.{8,}/, label: 'At least 8 characters long' },
  //   { re: /[A-Z]/, label: 'Includes uppercase letter' },
  //   { re: /[a-z]/, label: 'Includes lowercase letter' },
  //   { re: /[0-9]/, label: 'Includes a number' },
  //   { re: /[!@#$%^&*]/, label: 'Includes special character (!@#$%^&*)' },
  //   { re: /^(?!.*(.)\1{3,}).*$/, label: 'Does not contain repeated characters in sequence more than three times' },
  // ];

  // function getStrength(password: string) {
  //   let multiplier = password.length > 5 ? 0 : 1;

  //   requirements.forEach((requirement) => {
  //     if (!requirement.re.test(password)) {
  //       multiplier += 1;
  //     }
  //   });

  //   return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
  // }

  const [isEmailResend, setIsEmailResend] = useState(false);

  const resendEmail = async () => {
    try {
      if (!emailVerificationToResend) return;

      const csrfToken = await getCSRF();
      if (!csrfToken) return;

      console.log("csrfToken: ", csrfToken);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/send-validation-email/",
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
              You're registered!
            </Title>
            <Text align="center">
              We've sent a confirmation email to{" "}
              <strong>{form.values.email}</strong>. Please head to your inbox to
              verify.
            </Text>

            {!isEmailResend ? (
              <Text align="center">
                Didn't get the email?{" "}
                <Anchor component="button" onClick={resendEmail} type="button">
                  Resend Activation Email
                </Anchor>
              </Text>
            ) : (
              <Text align="center">
                We've just sent you another email. If you still didn't receive
                it, please contact us at <strong>help@shop-wiz.ie</strong>.
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
};

export default RegisterForm;
