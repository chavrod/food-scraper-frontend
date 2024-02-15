async function request(
  endpoint: string,
  method = "GET",
  accessToken: string | undefined,
  data: {} | null = null
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
    accessToken: string | undefined,
    params?: { [key: string]: string | number }
  ) => {
    if (params) {
      const queryString = new URLSearchParams(params as any).toString();
      endpoint = `${endpoint}?${queryString}`;
    }
    return request(endpoint, "GET", accessToken);
  },
  post: (endpoint: string, accessToken: string | undefined, data?: {}) =>
    request(endpoint, "POST", accessToken, data),
  delete: (endpoint: string, accessToken: string | undefined, data?: {}) =>
    request(endpoint, "DELETE", accessToken, data),
};

export default apiClient;
