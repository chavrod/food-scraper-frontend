import { signOut } from "next-auth/react";

export default async function logout(refreshToken: string | null) {
  try {
    if (refreshToken) {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}auth/logout/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to logout");
      }
    }

    // Clear the frontend session
    signOut({ callbackUrl: "/" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error logging out:", error);
  }
}
