"use client";
import { useState } from "react";
// Internal: Components
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
// External:
import { Button, Box, Paper, Stack, Divider, Group } from "@mantine/core";
import {
  IconBrandGoogle,
  IconMailPlus,
  IconMailForward,
} from "@tabler/icons-react";

interface LoginFormProps {
  handleLoginSucess: () => void;
}

const UserAccess: React.FC<LoginFormProps> = ({ handleLoginSucess }) => {
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(true);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);

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
              <Button variant="outline" fullWidth>
                <Group>
                  <IconBrandGoogle size="1.5rem" stroke={2.2} />
                  Continue with Google
                </Group>
              </Button>
              {isLoginFormVisible ? (
                <Button
                  variant="outline"
                  onClick={() => setIsLoginFormVisible(false)}
                  fullWidth
                >
                  <Group>
                    <IconMailPlus size="1.5rem" stroke={2.2} />
                    Register with email
                  </Group>
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
