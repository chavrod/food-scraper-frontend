import getCSRF from "../getCSRF";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}users/_allauth/browser/v1`;
const ACCEPT_JSON = {
  accept: "application/json",
};

export const AuthProcess = Object.freeze({
  LOGIN: "login",
  CONNECT: "connect",
});

export const Flows = Object.freeze({
  VERIFY_EMAIL: "verify_email",
  LOGIN: "login",
  SIGNUP: "signup",
  PROVIDER_REDIRECT: "provider_redirect",
  PROVIDER_SIGNUP: "provider_signup",
  REAUTHENTICATE: "reauthenticate",
});

export const URLs = Object.freeze({
  // Meta
  CONFIG: BASE_URL + "/config",

  // Account management
  CHANGE_PASSWORD: BASE_URL + "/account/password/change",
  EMAIL: BASE_URL + "/account/email",
  PROVIDERS: BASE_URL + "/account/providers",

  // Auth: Basics
  LOGIN: BASE_URL + "/auth/login",
  REQUEST_LOGIN_CODE: BASE_URL + "/auth/code/request",
  CONFIRM_LOGIN_CODE: BASE_URL + "/auth/code/confirm",
  SESSION: BASE_URL + "/auth/session",
  REAUTHENTICATE: BASE_URL + "/auth/reauthenticate",
  REQUEST_PASSWORD_RESET: BASE_URL + "/auth/password/request",
  RESET_PASSWORD: BASE_URL + "/auth/password/reset",
  SIGNUP: BASE_URL + "/auth/signup",
  VERIFY_EMAIL: BASE_URL + "/auth/email/verify",

  // Auth: Social
  PROVIDER_SIGNUP: BASE_URL + "/auth/provider/signup",
  REDIRECT_TO_PROVIDER: BASE_URL + "/auth/provider/redirect",
  PROVIDER_TOKEN: BASE_URL + "/auth/provider/token",

  // Auth: Sessions
  SESSIONS: BASE_URL + "/auth/sessions",
});

async function request(
  method: string,
  path: string,
  data?: any,
  headers?: any
) {
  const options: any = {
    method,
    headers: {
      ...ACCEPT_JSON,
      ...headers,
    },
    credentials: "include",
  };

  // Don't pass along authentication related headers to the config endpoint.
  if (path !== URLs.CONFIG) {
    options.headers["X-CSRFToken"] = await getCSRF();
  }

  if (typeof data !== "undefined") {
    options.body = JSON.stringify(data);
    options.headers["Content-Type"] = "application/json";
  }

  const resp = await fetch(path, options);
  let msg;
  try {
    msg = await resp.json();
  } catch {
    msg = {
      status: 500,
      data: "Server Error. Please try again later",
      meta: { is_authenticated: null },
    };
  }
  if (
    [401, 410].includes(msg.status) ||
    (msg.status === 200 && msg.meta?.is_authenticated)
  ) {
    const event = new CustomEvent("allauth.auth.change", { detail: msg });
    document.dispatchEvent(event);
  }
  return msg;
}

export async function getConfig() {
  return await request("GET", URLs.CONFIG);
}

export async function login(data: any) {
  return await request("POST", URLs.LOGIN, data);
}

export async function reauthenticate(data: any) {
  return await request("POST", URLs.REAUTHENTICATE, data);
}

export async function logout() {
  return await request("DELETE", URLs.SESSION);
}

export async function signUp(data: any) {
  return await request("POST", URLs.SIGNUP, data);
}

export async function requestPasswordReset(email: any) {
  return await request("POST", URLs.REQUEST_PASSWORD_RESET, { email });
}

export async function requestLoginCode(email: any) {
  return await request("POST", URLs.REQUEST_LOGIN_CODE, { email });
}

export async function confirmLoginCode(code: any) {
  return await request("POST", URLs.CONFIRM_LOGIN_CODE, { code });
}

export async function getEmailVerification(key: any) {
  return await request("GET", URLs.VERIFY_EMAIL, undefined, {
    "X-Email-Verification-Key": key,
  });
}

export async function getEmailAddresses() {
  return await request("GET", URLs.EMAIL);
}
export async function getSessions() {
  return await request("GET", URLs.SESSIONS);
}

export async function endSessions(ids: any) {
  return await request("DELETE", URLs.SESSIONS, { sessions: ids });
}

export async function verifyEmail(key: any) {
  return await request("POST", URLs.VERIFY_EMAIL, { key });
}

export async function getPasswordReset(key: any) {
  return await request("GET", URLs.RESET_PASSWORD, undefined, {
    "X-Password-Reset-Key": key,
  });
}

export async function resetPassword(data: any) {
  return await request("POST", URLs.RESET_PASSWORD, data);
}

export async function changePassword(data: any) {
  return await request("POST", URLs.CHANGE_PASSWORD, data);
}

export async function getAuth() {
  return await request("GET", URLs.SESSION);
}
