import { useState } from "react";
import {
  Stack,
  Text,
  Modal,
  Space,
  List,
  ThemeIcon,
  Paper,
  Group,
  Button,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconAlertTriangleFilled,
  IconHelpHexagonFilled,
  IconCircleCheckFilled,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface ResetPasswordModalProps {
  userEmail: string | null | undefined;
  userPasswordResetAttempts: number;
  isOpen: boolean;
  onClose: Function;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  userEmail,
  userPasswordResetAttempts,
  isOpen,
  onClose,
}) => {
  const DAILY_LIMIT = process.env.NEXT_PUBLIC_EMAIL_RESEND_LIMIT;

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
        setTimeout(() => {
          onClose();
        }, 2000);
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

  const DAILY_LIMIT_NUMBER = parseInt(
    process.env.NEXT_PUBLIC_EMAIL_RESEND_LIMIT || "0",
    10
  );
  const hasExceededDailyLimit = userPasswordResetAttempts >= DAILY_LIMIT_NUMBER;

  return (
    <Modal
      opened={isOpen}
      onClose={() => {
        onClose();
        if (showPasswordResetEmailConfirmation)
          setShowPasswordResetEmailConfirmation(false);
      }}
      title="Reset Password"
      centered
    >
      <Paper p="md" radius="sm" style={{ maxWidth: "400px", margin: "0 auto" }}>
        {hasExceededDailyLimit ? (
          <Stack
            justify="center"
            style={{ textAlign: "center" }}
            align="center"
          >
            <IconAlertTriangleFilled
              size={80}
              style={{ color: "red", marginBottom: "10px" }}
            />
            <Text align="center">
              You have exceeded your daily password reset attempts. Please try
              again tomorrow.
            </Text>
          </Stack>
        ) : showPasswordResetEmailConfirmation ? (
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
              We've sent a password reset email to <strong>{userEmail}</strong>.
              Please head to your inbox.
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
                After successfully changing your password, you will remain
                logged in.
              </List.Item>
              <List.Item
                icon={
                  <ThemeIcon color="yellow" size={24} radius="xl">
                    <IconAlertTriangleFilled size="1rem" />
                  </ThemeIcon>
                }
              >
                You can only send {DAILY_LIMIT} password change emails per day.
                Your current usage is {userPasswordResetAttempts}/{DAILY_LIMIT}.
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
            <Group grow>
              <Button
                variant="light"
                disabled={loading}
                onClick={() => {
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button loading={loading} onClick={sendPasswordResetEmail}>
                Send Email
              </Button>
            </Group>
          </>
        )}
      </Paper>
    </Modal>
  );
};

export default ResetPasswordModal;
