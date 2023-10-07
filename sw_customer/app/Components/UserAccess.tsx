"use client";
import { useState } from "react";
// Internal: Components
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
// External: Style
import { Button, Box, Paper, Stack, Divider, Group } from "@mantine/core";
import {
  IconBrandGoogle,
  IconMailPlus,
  IconMailForward,
} from "@tabler/icons-react";
// External: Logic
import { signIn } from "next-auth/react";

interface LoginFormProps {
  handleLoginSucess: () => void;
}

const UserAccess: React.FC<LoginFormProps> = ({ handleLoginSucess }) => {
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(true);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);

  const [isRedirecting, setIsRedirecting] = useState("");

  const handleAuthSuccess = () => {
    setIsAuthSuccess(true);

    if (isLoginFormVisible) {
      setTimeout(() => {
        handleLoginSucess();
      }, 1100);
    }
  };

  const handleMoveToLogin = () => {
    setIsAuthSuccess(false);
    setIsLoginFormVisible(true);
  };

  return (
    <Box maw={400} pos="relative">
      <Paper p="md" style={{ maxWidth: 400, margin: "0 auto" }}>
        {isLoginFormVisible ? (
          <LoginForm
            isLoginSuccess={isAuthSuccess}
            handleLoginSucess={handleAuthSuccess}
          ></LoginForm>
        ) : (
          <RegisterForm
            isRegistrationSubmitted={isAuthSuccess}
            handleRegistrationSubmission={handleAuthSuccess}
            handleMoveToLogin={handleMoveToLogin}
          ></RegisterForm>
        )}

        {!isAuthSuccess && (
          <>
            {" "}
            <Divider my="md" label="or" labelPosition="center" />
            <Stack>
              <Button
                variant="outline"
                leftIcon={<IconBrandGoogle size="1.5rem" stroke={2.2} />}
                loading={isRedirecting === "google"}
                onClick={() => {
                  setIsRedirecting("google");
                  signIn("google");
                }}
                fullWidth
              >
                {isRedirecting == "google"
                  ? "Redirecting to Google..."
                  : "Continue with Google"}
              </Button>
              {isLoginFormVisible ? (
                <Button
                  variant="outline"
                  leftIcon={<IconMailPlus size="1.5rem" stroke={2.2} />}
                  onClick={() => setIsLoginFormVisible(false)}
                  fullWidth
                >
                  Register with email
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsLoginFormVisible(true)}
                  fullWidth
                >
                  <Group>
                    <IconMailForward size="1.5rem" stroke={2.2} />
                    Login with email
                  </Group>
                </Button>
              )}
            </Stack>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default UserAccess;
