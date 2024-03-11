import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

type notiftErrorProps = {
  message: string;
  title?: string;
};

export default function notifyError({ message, title }: notiftErrorProps) {
  notifications.show({
    title: title || "Error",
    message,
    icon: <IconX size="1rem" />,
    color: "red",
    withBorder: true,
  });
}
