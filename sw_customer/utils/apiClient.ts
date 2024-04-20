async function request<T>(
  endpoint: string,
  method: string,
  accessToken: string | undefined,
  data: {} | null = null
): Promise<T> {
  const options: any = {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (accessToken) {
    options.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (data && Object.keys(data).length > 0) {
    options.body = JSON.stringify(data);
  }

  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  const response = await fetch(fullUrl, options);

  return (await response.json()) as T;
}

const apiClient = {
  get: <T>(
    endpoint: string,
    accessToken: string | undefined,
    params?: { [key: string]: string | number }
  ): Promise<T> => {
    let fullUrl = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params as any).toString();
      fullUrl = `${endpoint}?${queryString}`;
    }
    return request<T>(fullUrl, "GET", accessToken);
  },
  post: <T>(
    endpoint: string,
    accessToken: string | undefined,
    data?: {}
  ): Promise<T> => request<T>(endpoint, "POST", accessToken, data),
  delete: <T>(
    endpoint: string,
    accessToken: string | undefined,
    data?: {}
  ): Promise<T> => request<T>(endpoint, "DELETE", accessToken, data),
};

export default apiClient;
