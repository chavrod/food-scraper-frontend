import { useState, useEffect } from "react";
import {
  getEmailVerification,
  verifyEmail,
  AuthType,
} from "@/utils/auth/index";
import { Button, Stack, Title, Text } from "@mantine/core";
import notifyError from "@/utils/notifyError";

// This function will run on every request
export async function getServerSideProps(context: any) {
  const { key } = context.params;
  const access_key = key;
  return { props: { access_key } };
}

interface VerifyEmailProps {
  access_key: string;
}

export default function VerifyEmail({ access_key }: VerifyEmailProps) {
  const [response, setResponse] = useState({ fetching: false, content: null });
  const [verification, setVerification] = useState<AuthType | null>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const verificationData = await getEmailVerification(access_key);
        setVerification(verificationData);
      } catch (error) {
        console.error("Failed to get email verification:", error);
      }
    };

    fetchVerification();
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

  // if ([200, 401].includes(response.content?.status)) {
  //   return <Navigate to="/account/email" />;
  // }
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
