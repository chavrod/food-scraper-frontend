import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Button, Modal, Paper, Text, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";

import {
  getPasswordReset,
  resetPassword,
  AuthRes,
  formatAuthErrors,
} from "@/utils/auth/index";
import PasswordStrengthInput from "@/Components/account/PasswordStrengthInput";

export async function getServerSideProps(context: any) {
  return { props: { access_key: context.params.key } };
}

interface VerifyEmailProps {
  access_key: string;
}

export default function ResetPassword({ access_key }: VerifyEmailProps) {
  const router = useRouter();

  const [visible, { toggle }] = useDisclosure(false);

  // Response that checks if access_key is valid
  const [keyRes, setKeyRes] = useState<AuthRes | null>(null);
  // Response that checks if passoword reset was successful
  const [confirmationRes, setConfirmationRes] = useState<{
    fetching: boolean;
    content: AuthRes | null;
  }>({ fetching: false, content: null });

  const form = useForm({
    initialValues: {
      key: "",
      password1: "",
      password2: "", // repeat password
    },
    validate: {
      password1: (value) =>
        value.trim().length === 0 ? "Password is required." : null,
      password2: (value, values) =>
        value !== values.password1 ? "Passwords must match." : null,
    },
  });

  useEffect(() => {
    const fetchPasswordResetDetails = async (access_key: string) => {
      try {
        const keyRes = await getPasswordReset(access_key);
        form.setFieldValue("key", access_key);
        setKeyRes(keyRes);
      } catch (error) {
        form.setFieldValue("key", "");
        // TODO: REPORT UNKNOW ERROR TO SENTRY
        notifications.show({
          title: "Server Error!",
          message:
            "Unexpected error. Please try again later or contact help@shopwiz.ie",
          color: "red",
        });
      }
    };

    if (access_key) {
      fetchPasswordResetDetails(access_key);
    }
  }, [access_key]);

  const handleFormSubmit = async () => {
    try {
      setConfirmationRes({ ...confirmationRes, fetching: true });

      const { key, password1 } = form.values;
      const res = await resetPassword({ key, password: password1 });
      setConfirmationRes({ fetching: false, content: res });

      if (res.status === 400) {
        form.setErrors(formatAuthErrors(res.errors, { password: "password1" }));
      } else if (res.status !== 401) {
        // TODO: REPORT UNKNOW ERROR TO SENTRY
        notifications.show({
          title: "Server Error!",
          message:
            "Unexpected error. Please try again later or contact help@shopwiz.ie",
          color: "red",
        });
      }
    } catch (error) {
      // TODO: REPORT UNKNOW ERROR TO SENTRY
      notifications.show({
        title: "Server Error!",
        message: "Unexpected error. Please try again later.",
        color: "red",
      });
    } finally {
      if (confirmationRes.fetching)
        setConfirmationRes({ ...confirmationRes, fetching: false });
    }
  };

  if (
    confirmationRes.content?.status &&
    confirmationRes.content?.status === 401
  ) {
    router.push("/?password-reset=ok");
  }

  if (!keyRes) {
    return <></>;
  }

  return (
    <Modal
      opened={true}
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
          {keyRes.status === 200 ? (
            <form onSubmit={form.onSubmit(handleFormSubmit)}>
              <Text>
                Set new password for your{" "}
                <Text td="underline" c="blue" span>
                  {keyRes.data.user?.email}
                </Text>{" "}
                account.
              </Text>
              <PasswordStrengthInput
                form={form}
                isLoading={confirmationRes.fetching}
                visible={visible}
                toggle={toggle}
              />
              <Button
                type="submit"
                disabled={confirmationRes.fetching}
                loading={confirmationRes.fetching}
                fullWidth
                my="md"
              >
                Reset Password
              </Button>
            </form>
          ) : (
            <Text>Invalid password reset token.</Text>
          )}
        </Paper>
      </Stack>
    </Modal>
  );
}
