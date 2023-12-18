import { getSession } from "next-auth/react";

async function request(
  endpoint: string,
  method = "GET",
  data: {} | null = null
) {
  const options: any = {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const session = await getSession();
  if (session?.access_token) {
    options.headers.Authorization = `Bearer ${session.access_token}`;
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
  get: (endpoint: string, params?: { [key: string]: string | number }) => {
    if (params) {
      const queryString = new URLSearchParams(params as any).toString();
      endpoint = `${endpoint}?${queryString}`;
    }
    return request(endpoint, "GET");
  },
  post: (endpoint: string, data?: {}) => request(endpoint, "POST", data),
  delete: (endpoint: string, data?: {}) => request(endpoint, "DELETE", data),
};

export default apiClient;
