import { useState, useEffect, Dispatch, SetStateAction } from "react";
// Internal
import notifyError from "./notifyError";

export type Params = { [name: string]: any };

interface useApiProps {
  apiFunc: (params: any | void) => Promise<Response>;
  defaultParams?: Params;
  onSuccess: () => void;
}

export interface UseApiReturnType<T, M> {
  params: Params;
  setParams: Dispatch<SetStateAction<Params>>;
  request: (additionalParams?: any) => Promise<void>;
  responseData: {
    data?: T;
    metaData?: M;
  };
  loading: boolean;
  errors: any[];
}

function useApi<T, M = any>({
  apiFunc,
  defaultParams = {},
  onSuccess,
}: useApiProps): UseApiReturnType<T, M> {
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);

  const [responseData, setResponseData] = useState<{ data?: T; metaData?: M }>(
    {}
  );

  const request = async () => {
    if (apiFunc === undefined || params === undefined) return;

    setLoading(true);

    try {
      // Check if finalParams is not an empty object
      const hasParams = Object.keys({ ...params }).length > 0;

      // Call apiFunc with finalParams only if it's not empty
      const res = hasParams
        ? await apiFunc({ ...params })
        : await apiFunc(null);

      if (res.ok) {
        const jsonRes = await res.json();
        const { data, metadata } = jsonRes;

        setResponseData({ data: data, metaData: metadata });
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

  useEffect(() => {
    if (params.query && params.query.trim() !== "") {
      request();
    }
  }, [params]);

  return { params, setParams, request, responseData, loading, errors };
}

export default useApi;
