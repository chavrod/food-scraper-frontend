import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
// Internal
import notifyError from "./notifyError";

interface useApiSubmitProps<T> {
  apiFunc: (data: T, successMessage?: string) => Promise<Response>;
  onSuccess: () => void;
}

function useApiSubmit<T>({ apiFunc, onSuccess }: useApiSubmitProps<T>) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<any[]>([]);

  const handleSubmit = async (data: T, successMessage?: string) => {
    if (apiFunc === undefined) return;

    setLoading(true);

    try {
      const res = await apiFunc(data);

      if (res.ok) {
        await res.json();
        if (successMessage) {
          notifications.show({
            title: "Success!",
            message: successMessage,
            icon: <IconCheck size="1rem" />,
            color: "green",
            withBorder: true,
          });
        }

        onSuccess();
        return true;
      } else {
        const errorData = await res.json();

        Object.entries(errorData).forEach(([key, value]) => {
          const errorMessage = Array.isArray(value) ? value.join(", ") : value;
          notifyError(`${key}: ${errorMessage}`);
        });
      }
    } catch (err) {
      notifyError("Network or server error");
    } finally {
      setLoading(false);
    }

    return false;
  };

  return { handleSubmit, loading };
}

export default useApiSubmit;
