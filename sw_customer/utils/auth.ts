import { signOut } from "next-auth/react";

export const logout = async (refreshToken: string | null) => {
  try {
    if (!refreshToken) return;

    const response = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + "auth/logout/",
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

    // If successfully logged out from the backend, also clear the frontend session
    signOut();
  } catch (error) {
    console.error("Error logging out:", error);
  }
};
