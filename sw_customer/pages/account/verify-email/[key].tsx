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
import { getEmailVerification, verifyEmail, AuthRes } from "@/utils/auth/index";
import { Button, Stack, Title, Text } from "@mantine/core";
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

  const [response, setResponse] = useState<{
    fetching: boolean;
    content: AuthRes | null;
  }>({ fetching: false, content: null });
  const [verification, setVerification] = useState<AuthRes | null>(null);

  useEffect(() => {
    const fetchVerification = async (access_key: string) => {
      try {
        const verificationData = await getEmailVerification(access_key);
        setVerification(verificationData);
      } catch (error) {
        console.error("Failed to get email verification:", error);
      }
    };

    console.log("fetching verification....");
    if (access_key) {
      fetchVerification(access_key);
    }
  }, [access_key]);

  function submit() {
    setResponse({ ...response, fetching: true });
    verifyEmail(access_key)
      .then((content) => {
        console.log("content: ", content);
        setResponse((r) => {
          return { ...r, content };
        });
        if (content.status == 500) {
          notifyError({ message: content.data });
        }
      })
      .catch((e) => {
        console.error(e);
        notifyError({ message: e.data });
      })
      .then(() => {
        setResponse((r) => {
          return { ...r, fetching: false };
        });
      });
  }

  if (
    response.content?.status &&
    [200, 401].includes(response.content?.status)
  ) {
    router.push("/?login=successful-email-confirmation");
  }

  if (!verification) {
    return <></>;
  }

  let body = null;
  if (verification.status === 200) {
    body = (
      <>
        <Text>
          Please confirm that{" "}
          <a href={"mailto:" + verification.data.email}>
            {verification.data.email}
          </a>{" "}
          is an email address for user {verification?.data?.user?.username}.
        </Text>
        <Button size="lg" disabled={response.fetching} onClick={() => submit()}>
          Confirm
        </Button>
      </>
    );
  } else if (!verification.data?.email) {
    body = <Text>Invalid verification link.</Text>;
  } else {
    body = (
      <Text>
        Unable to confirm email{" "}
        <a href={"mailto:" + verification.data.email}>
          {verification.data.email}
        </a>{" "}
        because it is already confirmed.
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
