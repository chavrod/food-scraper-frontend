import { showNotification } from "@mantine/notifications";
import { useState } from "react";

interface useApiSubmitProps {
  apiFunc: (params: any | void) => Promise<Response>;
  onSuccess: (res: any) => void;
  debug: boolean;
}

const useApi = ({ apiFunc, onSuccess, debug }: useApiSubmitProps) => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const go = async (params: any) => {
    setErrors([]);
    setLoading(true);
    const res = await apiFunc(params);
    console.log(res);
    setLoading(false);
    debug && console.log(res);
    if (res.ok) {
      onSuccess(res);
    } else {
      if (res.status === 500) {
        showNotification({ message: "Server Error", color: "red" });
      } else {
        // if (typeof res.data === "string") {
        //   return;
        // }
        // const nonFieldErrors = Object.entries(res.data).map(
        //   ([_, value]) => value as string
        // );
        // if (nonFieldErrors.length > 0) {
        //   showNotification({ message: nonFieldErrors[0], color: "red" });
        //   setErrors(nonFieldErrors);
        // }
      }
    }
  };
  return { loading, errors, go };
};

export default useApi;
