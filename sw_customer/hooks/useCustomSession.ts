import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { Session } from "next-auth";

export async function fetchSession(): Promise<Session | null> {
  const res = await fetch("/api/auth/session");
  const session: Session = await res.json();
  return Object.keys(session).length ? session : null;
}

interface UseSessionOptions {
  required?: boolean;
  redirectTo?: string;
  queryConfig?: any;
}

// onSettled(data, error) {
//   if (required && !data) {
//     router.push(redirectTo);
//   }
//   if (queryConfig.onSettled) {
//     queryConfig.onSettled(data, error);
//   }
// }

export function useCustomSession({
  required = false,
  redirectTo = "/api/auth/signin?error=SessionExpired",
  queryConfig = {},
}: UseSessionOptions = {}) {
  const router = useRouter();
  const {
    data: session,
    isLoading,
    isError,
  } = useQuery<Session | null, Error>({
    queryKey: ["session"],
    queryFn: fetchSession,
  });

  return { session, isLoading, isError };
}
