import type { AdminStrings } from "./types";

// English is the admin client's default catalogue (design D6/SD-5).
export const en: AdminStrings = {
  title: { label: "Administration", tooltip: "Store administration", mnemonic: "a" },
  landingDescription: { label: "Sign in to review and approve pending orders." },
  signInLink: { label: "Sign in" },
  consoleTitle: { label: "Administration console" },
  manageOrdersLink: { label: "Manage orders" },
  signOutButton: { label: "Sign out" },
  accessRefusedTitle: { label: "Access refused" },
  accessRefusedDescription: {
    label: "You are not authorised to view the administration console.",
  },
  signInHeading: { label: "Administration sign-in" },
  signInHint: {
    label: "Sign in with your administrator user ID and password to manage orders and view sales.",
  },
  staffOnlyLabel: { label: "Staff only" },
  userIdLabel: { label: "User ID" },
  userIdPlaceholder: { label: "Enter your user ID" },
  passwordLabel: { label: "Password" },
  passwordPlaceholder: { label: "Enter your password" },
  submitLabel: { label: "Sign in" },
  emptyFieldTemplate: { label: "{field} is empty." },
  loginErrorTitle: { label: "Login error" },
  loginErrorDescription: {
    label:
      "The user could not be authenticated. Please check your username and password and try again.",
  },
  backToSignInLink: { label: "Back to administration sign-in" },
  storeHomeLink: { label: "Store home" },
};
