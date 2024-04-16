import { notifications } from "@mantine/notifications";
import React, { useState } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
// Internal
import notifyError from "./notifyError";

interface UseApiSubmitProps<T> {
  apiFunc: (accessToken: string | undefined, data: T) => Promise<Response>;
  onSuccess: () => void;
  accessToken: string | undefined;
}

function useApiSubmit<T>({
  apiFunc,
  onSuccess,
  accessToken,
}: UseApiSubmitProps<T>) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any[]>([]);

  const handleSubmit = async (
    data: T,
    successMessage?: {
      title: string;
      body: string;
    }
  ): Promise<boolean> => {
    if (apiFunc === undefined) return false;

    setLoading(true);

    try {
      const res = await apiFunc(accessToken, data);

      if (res.ok) {
        await res.json();
        if (successMessage) {
          notifications.show({
            title: successMessage.title,
            message: successMessage.body,
            icon: <IconCheck size="1rem" />,
            color: "green",
            withBorder: true,
          });
        }

        onSuccess();
        return true;
      }
      const errorData = await res.json();

      Object.entries(errorData).forEach(([key, value]) => {
        const errorMessage = Array.isArray(value) ? value.join(", ") : value;
        notifyError({ message: `${key}: ${errorMessage}` });
      });
    } catch (err) {
      notifyError({ message: "Network or server error" });
    } finally {
      setLoading(false);
    }

    return false;
  };

  return { handleSubmit, loading };
}

export default useApiSubmit;
