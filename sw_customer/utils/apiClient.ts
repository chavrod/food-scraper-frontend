async function request(
  endpoint: string,
  method: string,
  accessToken: string | undefined,
  data: {} | null = null
): Promise<Response> {
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

  return response;
}

const apiClient = {
  get: (
    endpoint: string,
    accessToken: string | undefined,
    params?: { [key: string]: string | number }
  ): Promise<Response> => {
    let fullUrl = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params as any).toString();
      fullUrl = `${endpoint}?${queryString}`;
    }
    return request(fullUrl, "GET", accessToken);
  },
  post: (
    endpoint: string,
    accessToken: string | undefined,
    data?: {}
  ): Promise<Response> => request(endpoint, "POST", accessToken, data),
  delete: (
    endpoint: string,
    accessToken: string | undefined,
    data?: {}
  ): Promise<Response> => request(endpoint, "DELETE", accessToken, data),
};

export default apiClient;
