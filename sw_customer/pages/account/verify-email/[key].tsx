/**
 * Flow:
 * 1. User lands here though the link in their email, which includes a unique access key.
 * 2. `getServerSideProps` extracts this `access_key` from the URL
 *    and passes it as props to the `VerifyEmail` component.
 * 3. The component fetches email verification info using the key.
 *    - If a 200 response is received, it displays the email and a confirm button.
 *    - If the link is invalid or the email is already verified, it displays an appropriate message.
 * 4. On confirmation, `submit` sends a POST request to verify the email.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { Button, Stack, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { getEmailVerification, verifyEmail, AuthRes } from "@/utils/auth/index";
import notifyError from "@/utils/notifyError";

// This function will run on every request
// NOTE: just testing how this works not necessary...
export async function getServerSideProps(context: any) {
  return { props: { access_key: context.params.key } };
}

interface VerifyEmailProps {
  access_key: string;
}

export default function VerifyEmail({ access_key }: VerifyEmailProps) {
  const router = useRouter();

  const [confirmationRes, setConfirmationRes] = useState<{
    fetching: boolean;
    content: AuthRes | null;
  }>({ fetching: false, content: null });
  const [keyRes, setKeyRes] = useState<AuthRes | null>(null);

  useEffect(() => {
    const fetchVerificationDetails = async (access_key: string) => {
      try {
        const keyRes = await getEmailVerification(access_key);
        setKeyRes(keyRes);
      } catch (error) {
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
      fetchVerificationDetails(access_key);
    }
  }, [access_key]);

  function submit() {
    setConfirmationRes({ ...confirmationRes, fetching: true });
    verifyEmail(access_key)
      .then((content) => {
        setConfirmationRes((r) => {
          return { ...r, content };
        });
        if (content.status == 500) {
          notifyError({ message: content.data });
        }
      })
      .catch((e) => {
        notifyError({ message: e.data });
      })
      .then(() => {
        setConfirmationRes((r) => {
          return { ...r, fetching: false };
        });
      });
  }

  if (
    confirmationRes.content?.status &&
    [401].includes(confirmationRes.content?.status)
  ) {
    router.push("/?login=successful-email-confirmation");
  }

  if (!keyRes) {
    return <></>;
  }

  let body = null;
  if (keyRes.status === 200) {
    body = (
      <>
        <Text>
          Please confirm that{" "}
          <a href={"mailto:" + keyRes.data.email}>{keyRes.data.email}</a> is an
          email address for user {keyRes?.data?.user?.username}.
        </Text>
        <Button
          size="lg"
          disabled={confirmationRes.fetching}
          loading={confirmationRes.fetching}
          onClick={() => submit()}
        >
          Confirm
        </Button>
      </>
    );
  } else if (!keyRes.data?.email) {
    body = <Text>Invalid verification link.</Text>;
  } else {
    body = (
      <Text>
        Unable to confirm email{" "}
        <a href={"mailto:" + keyRes.data.email}>{keyRes.data.email}</a> because
        it is already confirmed.
      </Text>
    );
  }
  return (
    <Stack m="xl" h="calc(100vh - 210px)" align="center" justify="center">
      <Title order={2}>Confirm Email Address</Title>
      {body}
    </Stack>
  );
}
