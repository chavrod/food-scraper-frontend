import React, { useState } from "react";
import {
  Button,
  Box,
  Paper,
  Stack,
  Divider,
  Group,
  Notification,
} from "@mantine/core";
import {
  IconBrandGoogle,
  IconMailPlus,
  IconMailForward,
  IconCheck,
} from "@tabler/icons-react";
// External: Logic
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface LoginFormProps {
  isEmailConfirmed: boolean;
  handleLoginSucess: () => void;
}

const UserAccess = React.memo(
  ({ isEmailConfirmed, handleLoginSucess }: LoginFormProps) => {
    const queryClient = useQueryClient();

    const [isLoginFormVisible, setIsLoginFormVisible] = useState(true);
    const [isAuthSuccess, setIsAuthSuccess] = useState(false);

    const [isRedirecting, setIsRedirecting] = useState("");

    const handleAuthSuccess = () => {
      setIsAuthSuccess(true);

      queryClient.invalidateQueries({
        queryKey: ["session"],
      });

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
            <>
              {isEmailConfirmed && !isAuthSuccess && (
                <Notification
                  icon={<IconCheck size="1.2rem" />}
                  withCloseButton={false}
                  color="teal"
                  title="Great! Your email is confirmed!"
                  mb="md"
                  withBorder
                  sx={{ boxShadow: "none" }}
                >
                  Please login with the verified email
                </Notification>
              )}

              <LoginForm
                isLoginSuccess={isAuthSuccess}
                handleLoginSucess={handleAuthSuccess}
              />
            </>
          ) : (
            <RegisterForm
              isRegistrationSubmitted={isAuthSuccess}
              handleRegistrationSubmission={handleAuthSuccess}
              handleMoveToLogin={handleMoveToLogin}
            />
          )}

          {!isAuthSuccess && (
            <>
              {" "}
              <Divider mb="md" mt="sm" label="or" labelPosition="center" />
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
                  {isRedirecting === "google"
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
  }
);

export default UserAccess;
