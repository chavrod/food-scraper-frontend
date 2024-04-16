import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Define types for the environment variables and any other variables
declare let process: {
  env: {
    NEXTAUTH_BACKEND_URL: string;
    NEXTAUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
};

// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 45 * 60; // 45 minutes
const BACKEND_REFRESH_TOKEN_LIFETIME = 6 * 24 * 60 * 60; // 6 days

const getCurrentEpochTime = () => Math.floor(new Date().getTime() / 1000);

const SIGN_IN_HANDLERS: Record<
  string,
  (
    user: any,
    account: any,
    profile: any,
    email: any,
    credentials: any
  ) => Promise<boolean>
> = {
  credentials: async (user, account, profile, email, credentials) => true,
  google: async (user, account, profile, email, credentials) => {
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_BACKEND_URL}auth/google/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: account.id_token,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend");
      }

      const data = await response.json();
      account.meta = data;
      return true;
    } catch (error) {
      return false;
    }
  },
};
const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: BACKEND_REFRESH_TOKEN_LIFETIME,
  },
  pages: {
    signIn: "/?login=open",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // The data returned from this function is passed forward as the
      // `user` variable to the signIn() and jwt() callback
      async authorize(
        credentials: { email: string; password: string } | undefined,
        req: any
      ) {
        try {
          const response = await fetch(
            `${process.env.NEXTAUTH_BACKEND_URL}auth/login/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(credentials),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            const errorMessage = data.non_field_errors
              ? data.non_field_errors[0]
              : "Unknown error occurred.";
            return { error: errorMessage };
          }

          if (data) return data;
        } catch (error) {
          console.error(error);
        }
        return null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (user?.error) {
        throw new Error(user?.error);
      }
      if (!account?.provider || !SIGN_IN_PROVIDERS.includes(account.provider)) {
        return false;
      }
      return SIGN_IN_HANDLERS[account.provider](
        user,
        account,
        profile,
        email,
        credentials
      );
    },
    async jwt({ user, token, account, trigger }) {
      // If `user` and `account` are set that means it is a login event
      if (user && account) {
        let backendResponse =
          account.provider === "credentials" ? user : (account.meta as any);
        token.user = backendResponse.user;
        token.access_token = backendResponse.access;
        token.refresh_token = backendResponse.refresh;
        token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
        return token;
      }
      if (trigger === "update") {
        const response = await fetch(
          `${process.env.NEXTAUTH_BACKEND_URL}auth/user/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token.access_token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Network response was not ok.");

        const updatedUserInfo = await response.json();
        token.user = updatedUserInfo; // Update the user data in the token
      }
      // Refresh the backend token if necessary
      if (typeof token.ref === "number" && getCurrentEpochTime() > token.ref) {
        const response = await fetch(
          `${process.env.NEXTAUTH_BACKEND_URL}auth/token/refresh/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh: token.refresh_token,
            }),
          }
        );

        if (!response.ok) throw new Error("Network response was not ok.");

        const data = await response.json();
        token.access_token = data.access;
        token.refresh_token = data.refresh;
        token.ref = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
      }
      return token;
    },
    async redirect({ url }) {
      return url;
    },
    // Since we're using Django as the backend we have to pass the JWT
    // token to the client instead of the `session`.
    async session({ session, token }) {
      return token;
    },
  },
};

export default NextAuth(authOptions);
