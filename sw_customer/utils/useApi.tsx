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
  request: (additionalParams?: any) => Promise<void>;
  responseData: {
    data?: T;
    metaData?: M;
  };
  loading: boolean;
  errors: any[];
  page: number;
}

function useApi<T, M = any>({
  apiFunc,
  defaultParams = {},
  onSuccess,
}: useApiProps): UseApiReturnType<T, M> {
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);

  const [page, setPage] = useState<number>(1);
  const [responseData, setResponseData] = useState<{ data?: T; metaData?: M }>(
    {}
  );

  const request = async (additionalParams = {}) => {
    if (apiFunc === undefined) return;

    setLoading(true);

    try {
      const finalParams = { ...params, ...additionalParams };
      // Check if finalParams is not an empty object
      const hasParams = Object.keys(finalParams).length > 0;

      // Call apiFunc with finalParams only if it's not empty
      const res = hasParams ? await apiFunc(finalParams) : await apiFunc(null);

      if (res.ok) {
        const jsonRes = await res.json();
        const { data, metadata } = jsonRes;

        setResponseData({ data: data, metaData: metadata });
        if (metadata.page) {
          setPage(metadata.page);
        }
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

  return { page, request, responseData, loading, errors };
}

export default useApi;
