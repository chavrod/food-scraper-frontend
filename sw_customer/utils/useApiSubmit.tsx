import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
// Internal
import notifyError from "./notifyError";

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
        const successData = await res.json();
        notifications.show({
          title: "Success!",
          message: `Added ${
            successData?.product?.name || "product"
          } to basket.`,
          icon: <IconCheck size="1rem" />,
          color: "green",
          withBorder: true,
        });

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
