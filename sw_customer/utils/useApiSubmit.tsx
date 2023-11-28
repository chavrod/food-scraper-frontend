import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { IconX } from "@tabler/icons-react";

interface useApiSubmitProps<T> {
  apiFunc: (data: T) => Promise<Response>;
  data?: T;
  onSuccess: () => void;
}

function useApiSubmit<T>({ apiFunc, onSuccess }: useApiSubmitProps<T>) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any[]>([]);

  const handleSubmit = async (data: T) => {
    if (apiFunc === undefined) return;

    setLoading(true);

    try {
      const res = await apiFunc(data);

      if (res.ok) {
        onSuccess();
        return true;
      } else {
        const errorData = await res.json();

        // Handle different error formats
        if (errorData.error) {
          // Single error message
          notifyError(errorData.error);
        } else {
          // Multiple error messages
          Object.entries(errorData).forEach(([key, value]) => {
            const errorMessage = Array.isArray(value)
              ? value.join(", ")
              : value;
            notifyError(`${key}: ${errorMessage}`);
          });
        }
      }
    } catch (err) {
      notifyError("Network or server error");
    } finally {
      setLoading(false);
    }

    return false;
  };

  // Helper function for notifications
  function notifyError(message: string) {
    notifications.show({
      title: "Error",
      message,
      icon: <IconX size="1rem" />,
      color: "red",
      withBorder: true,
    });
  }

  return { handleSubmit, loading };
}

export default useApiSubmit;
