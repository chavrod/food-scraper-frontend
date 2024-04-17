import NextAuth from "next-auth";

import { CustomUserDetailsSerializer } from "./customer_types";

// prevents IDEs from removing the unused `NextAuth` import
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
NextAuth.name;

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context.
   * Session `user` should only contain immutable variables.
   */
  interface Session {
    access_token: string;
    refresh_token: string;
    user: CustomUserDetailsSerializer;
  }
}
