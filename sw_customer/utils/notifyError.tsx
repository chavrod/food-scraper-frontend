import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

export default function notifyError(message: string) {
  notifications.show({
    title: "Error",
    message,
    icon: <IconX size="1rem" />,
    color: "red",
    withBorder: true,
  });
}
