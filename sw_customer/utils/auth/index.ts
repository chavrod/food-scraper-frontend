export { AuthContextProvider } from "./AuthContext";
export type { AuthRes, AuthFlow } from "./AuthContext";
export {
  useConfig,
  useAuth,
  useUser,
  useAuthStatus,
  useAuthInfo,
} from "./hooks";
// export {
//   URLs,
//   pathForPendingFlow,
//   pathForFlow,
//   AuthChangeRedirector,
//   AuthenticatedRoute,
//   AnonymousRoute,
// } from "./routing";
export {
  login,
  signUp,
  formatAuthErrors,
  getEmailVerification,
  verifyEmail,
} from "./api";
