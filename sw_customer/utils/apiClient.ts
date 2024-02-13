async function request(
  endpoint: string,
  method = "GET",
  data: {} | null = null,
  accessToken: string | null = null
) {
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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    options
  );

  return response;
}

const apiClient = {
  get: (
    endpoint: string,
    params?: { [key: string]: string | number },
    accessToken?: string
  ) => {
    if (params) {
      const queryString = new URLSearchParams(params as any).toString();
      endpoint = `${endpoint}?${queryString}`;
    }
    return request(endpoint, "GET", accessToken);
  },
  post: (endpoint: string, data?: {}, accessToken?: string) =>
    request(endpoint, "POST", data, accessToken),
  delete: (endpoint: string, data?: {}, accessToken?: string) =>
    request(endpoint, "DELETE", data, accessToken),
};

export default apiClient;
