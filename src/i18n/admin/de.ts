import type { AdminStrings } from "./types";

// German catalogue (design D6/SD-5): the legacy Swing admin client shipped
// petstore_de.properties alongside the English default.
export const de: AdminStrings = {
  title: { label: "Verwaltung", tooltip: "Shopverwaltung", mnemonic: "v" },
  landingDescription: {
    label: "Melden Sie sich an, um ausstehende Bestellungen zu prüfen und freizugeben.",
  },
  signInLink: { label: "Anmelden" },
  consoleTitle: { label: "Verwaltungskonsole" },
  manageOrdersLink: { label: "Bestellungen verwalten" },
  signOutButton: { label: "Abmelden" },
  accessRefusedTitle: { label: "Zugriff verweigert" },
  accessRefusedDescription: {
    label: "Sie sind nicht berechtigt, auf die Verwaltungskonsole zuzugreifen.",
  },
  signInHeading: { label: "Administratoranmeldung" },
  signInHint: {
    label:
      "Melden Sie sich mit Ihrer Administrator-Benutzer-ID und Ihrem Passwort an, um Bestellungen zu verwalten und Verkäufe einzusehen.",
  },
  staffOnlyLabel: { label: "Nur für Mitarbeiter" },
  userIdLabel: { label: "Benutzer-ID" },
  userIdPlaceholder: { label: "Benutzer-ID eingeben" },
  passwordLabel: { label: "Passwort" },
  passwordPlaceholder: { label: "Passwort eingeben" },
  submitLabel: { label: "Anmelden" },
  emptyFieldTemplate: { label: "{field} ist leer." },
  loginErrorTitle: { label: "Anmeldefehler" },
  loginErrorDescription: {
    label:
      "Der Benutzer konnte nicht authentifiziert werden. Bitte überprüfen Sie Benutzername und Passwort und versuchen Sie es erneut.",
  },
  backToSignInLink: { label: "Zurück zur Administratoranmeldung" },
  storeHomeLink: { label: "Zur Startseite" },
};
