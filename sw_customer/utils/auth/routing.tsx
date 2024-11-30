import React from "react";
import { useRouter } from "next/router";
import { useAuthChange, AuthChangeEvent, authInfo } from "./hooks";
// import { Flows, AuthFlowType, AuthenticatorType } from "../lib/allauth";
import { Flows } from "./api";
import { AuthFlow, AuthType } from "./AuthContext";

export const URLs = Object.freeze({
  LOGIN_URL: "/?login=open",
  LOGIN_REDIRECT_URL: "/",
  LOGOUT_REDIRECT_URL: "/",
});

export const Flow2Path = Object.freeze({
  [Flows.LOGIN]: "/?login=open",
  [Flows.SIGNUP]: "signup", // TODO: Change
  [Flows.VERIFY_EMAIL]: "verify_email", // TODO: Change
  [Flows.PROVIDER_REDIRECT]: "provider_redirect", // TODO: Change
  [Flows.PROVIDER_SIGNUP]: "provider_signup", // TODO: Change
  [Flows.REAUTHENTICATE]: "reauthenticate", // TODO: Change
});

export function pathForFlow(flow?: AuthFlow) {
  if (!flow) {
    throw new Error("No flow provided");
  }

  const path = Flow2Path[flow.id];
  if (!path) {
    throw new Error(`Unknown path for flow: ${flow.id}`);
  }
  return path;
}

export function pathForPendingFlow(auth?: AuthType) {
  if (!auth) return null;

  const flow = auth?.data?.flows?.find((flow) => flow.is_pending);
  if (flow) {
    return pathForFlow(flow);
  }
  return null;
}

// Define protected routes (as patterns)
const PROTECTED_ROUTES = Object.freeze(["/account-settings"]);

// Function to check if the current path is a protected route
function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some((protectedRoute) =>
    pathname.startsWith(protectedRoute)
  );
}

export function AuthRoutingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [auth, event] = useAuthChange();
  const status = authInfo(auth);

  switch (event) {
    case AuthChangeEvent.LOGGED_OUT:
      router.push(URLs.LOGOUT_REDIRECT_URL);
      break;
    case AuthChangeEvent.LOGGED_IN:
      router.push(URLs.LOGIN_REDIRECT_URL);
    case AuthChangeEvent.REAUTHENTICATED: {
      const next = new URLSearchParams(location.search).get("next") || "/";
      router.push(next);
      break;
    }
    case AuthChangeEvent.REAUTHENTICATION_REQUIRED: {
      const next = `next=${encodeURIComponent(
        location.pathname + location.search
      )}`;
      const path = pathForFlow(auth?.data?.flows?.[0]);
      router.push({
        pathname: path,
        query: { next },
      });
      break;
    }
    case AuthChangeEvent.FLOW_UPDATED:
      const path = pathForPendingFlow(auth);
      if (!path) {
        throw new Error();
      }
      router.push(path);
    default:
      // Check if the route is protected
      if (isProtectedRoute(router.pathname)) {
        if (!status.isAuthenticated) {
          // Redirect to login if the user is not authenticated
          const next = `next=${encodeURIComponent(router.asPath)}`;
          router.push(`${URLs.LOGIN_URL}?${next}`);
          return null;
        }
      }
  }
  // ...stay where we are
  return children;
}
