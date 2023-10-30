import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { Modal, Button, Text, Input, Stack, Group } from "@mantine/core";
import { IconCircleCheckFilled } from "@tabler/icons-react";
// Internal: Utils
import { signOut } from "next-auth/react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: Function;
  accressToken: string | undefined;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  accressToken,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const router = useRouter();

  const handleDelete = async () => {
    if (!accressToken) return;
    try {
      setLoading(true);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "auth/delete-account/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accressToken}`,
          },
        }
      );

      console.log(response);

      if (response.ok) {
        setLoading(false);
        setIsDeleted(true);
        setTimeout(() => {
          onClose();
          router.push("/");
          signOut();
        }, 3000);
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

  return (
    <Modal
      opened={isOpen}
      onClose={() => {
        onClose();
      }}
      title="Delete Account"
      centered
    >
      {isDeleted ? (
        <Stack justify="center" style={{ textAlign: "center" }} align="center">
          <IconCircleCheckFilled
            size={80}
            style={{ color: "green", marginBottom: "10px" }}
          />
          <Text align="center">
            Your account has been successfully deleted. You'll be redirected to
            the homepage.
          </Text>
        </Stack>
      ) : (
        <>
          <Text>
            Deleting your account is a permanent action and cannot be undone.
            Please type "DELETE" below to confirm.
          </Text>
          <Input
            mt="sm"
            placeholder="Type DELETE to confirm"
            onChange={(e) => setConfirmed(e.target.value === "DELETE")}
          />
          <Group position="right">
            <Button
              mt="sm"
              color="red"
              loading={loading}
              disabled={!confirmed || loading}
              onClick={handleDelete}
            >
              Confirm Deletion
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
};

export default DeleteAccountModal;
