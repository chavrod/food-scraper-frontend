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

  if (data && Object.keys(data).length > 0) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    options
  );

  if (!response.ok) {
    console.log(response);
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return response;
}

const apiClient = {
  get: (endpoint: string, data?: {}) => {
    if (data) {
      const queryString = new URLSearchParams(data).toString();
      endpoint = `${endpoint}?${queryString}`;
    }
    return request(endpoint, "GET");
  },
  post: (endpoint: string, data?: {}) => request(endpoint, "POST", data),
};

export default apiClient;
