const setCookie = (name: string, value: string, days?: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/`;
};

export default async function getCSRF(): Promise<string | null> {
  // Make a request to the Django endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}ping/`); // Adjust this to the path of your Django endpoint

  // Check if response is okay
  if (!response.ok) {
    throw new Error("Failed to get CSRF token from server");
  }

  // Extract the CSRF token from the response body
  const data = await response.json();
  const { csrfToken } = data;

  if (!csrfToken) {
    throw new Error("Failed to get CSRF token");
  }

  // Set CSRF token as a cookie
  setCookie("csrftoken", csrfToken, 1); // The token will expire in 1 day

  return csrfToken;
}
