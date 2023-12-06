import { showNotification } from "@mantine/notifications";
import { useState } from "react";
// Internal
import notifyError from "./notifyError";

export type Params = { [name: string]: any };

interface useApiProps {
  apiFunc: (params: any | void) => Promise<Response>;
  defaultParams?: Params;
  onSuccess: () => void;
}

function useApi<T, M = any>({
  apiFunc,
  defaultParams = {},
  onSuccess,
}: useApiProps) {
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);

  const [responseData, setResponseData] = useState<{ data?: T; metaData?: M }>(
    {}
  );

  const request = async () => {
    if (apiFunc === undefined) return;

    setLoading(true);

    try {
      const res = await apiFunc(params);

      if (res.ok) {
        const jsonRes = await res.json();
        const { data, metadata } = jsonRes;

        setResponseData({ data, metaData: metadata });
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
  };

  // const go = async (params: any) => {
  //   setErrors([]);
  //   setLoadingRequest(true);
  //   const res = await apiFunc(params);
  //   console.log(res);
  //   setLoadingRequest(false);
  //   console.log(res);
  //   if (res.ok) {
  //     onSuccess(res);
  //   } else {
  //     if (res.status === 500) {
  //       showNotification({ message: "Server Error", color: "red" });
  //     } else {
  //       // if (typeof res.data === "string") {
  //       //   return;
  //       // }
  //       // const nonFieldErrors = Object.entries(res.data).map(
  //       //   ([_, value]) => value as string
  //       // );
  //       // if (nonFieldErrors.length > 0) {
  //       //   showNotification({ message: nonFieldErrors[0], color: "red" });
  //       //   setErrors(nonFieldErrors);
  //       // }
  //     }
  //   }
  // };

  return { request, responseData, loading, errors };
}

export default useApi;
