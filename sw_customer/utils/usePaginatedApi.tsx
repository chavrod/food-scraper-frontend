import { useState } from "react";
// Internal
import notifyError from "./notifyError";

export type Params = { [name: string]: any };

interface useApiProps {
  apiFunc: (
    accessToken: string | undefined,
    params: any | void
  ) => Promise<Response>;
  defaultParams?: Params;
  onSuccess: () => void;
  accessToken: string | undefined;
}

export interface UseApiReturnType<T, M> {
  request: (additionalParams?: any) => Promise<void>;
  responseData: {
    data?: T;
    metaData?: M;
  };
  loading: boolean;
  errors: any[];
  pagination: {
    page: number;
    totalPages: number;
  };
}

function usePaginatedApi<T, M = any>({
  apiFunc,
  defaultParams = {},
  onSuccess,
  accessToken,
}: useApiProps): UseApiReturnType<T, M> {
  const [params, setParams] = useState(defaultParams);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);

  // Combine page and totalPages into a single state object
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
  }>({
    page: 1,
    totalPages: 0,
  });
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
      const res = hasParams
        ? await apiFunc(accessToken, finalParams)
        : await apiFunc(accessToken, null);

      if (res.ok) {
        const jsonRes = await res.json();
        const { data, metadata } = jsonRes;

        setResponseData({ data: data, metaData: metadata });

        setPagination({
          page: metadata.page || 1,
          totalPages: metadata.total_pages || 0,
        });
      } else {
        const errorData = await res.json();

        Object.entries(errorData).forEach(([key, value]) => {
          const errorMessage = Array.isArray(value) ? value.join(", ") : value;
          notifyError({ message: `${key}: ${errorMessage}` });
        });
      }
    } catch (err) {
      notifyError({ message: "Network or server error" });
    } finally {
      setLoading(false);
    }
  };

  return { pagination, request, responseData, loading, errors };
}

export default usePaginatedApi;
