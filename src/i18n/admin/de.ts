import type { AdminStrings } from "./types";

// German catalogue (design D6/SD-5): the legacy Swing admin client shipped
// petstore_de.properties alongside the English default.
export const de: AdminStrings = {
  title: { label: "Verwaltung", tooltip: "Shopverwaltung", mnemonic: "v" },
  landingDescription: {
    label: "Melden Sie sich an, um ausstehende Bestellungen zu prüfen und freizugeben.",
  },
  signInLink: { label: "Anmelden" },
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
  consoleTitle: { label: "Willkommen bei der Pet-Store-Verwaltung" },
  consoleBadge: { label: "Administrator" },
  consoleDescription: {
    label:
      "Im Bestellverwaltungs-Arbeitsbereich sehen Sie Umsatz und Bestellungen nach Status und genehmigen oder lehnen Bestellungen ab, die auf eine Entscheidung warten.",
  },
  launchClientButton: { label: "Rich Client starten" },
  logoutButton: { label: "abmelden" },
  launchFailed: { label: "Der Bestell-Client konnte nicht gestartet werden." },
  workspaceHeading: { label: "Im Arbeitsbereich" },
  workspacePendingText: {
    label: "Bestellungen genehmigen oder ablehnen und die Entscheidungen gemeinsam übernehmen.",
  },
  workspaceNonPendingText: {
    label: "Schreibgeschützte Liste genehmigter, abgelehnter und abgeschlossener Bestellungen.",
  },
  workspaceSalesText: { label: "Umsatzanteil und bestellte Menge je Kategorie in einem Zeitraum." },
  autoApprovalNote: {
    label:
      "Bestellungen werden automatisch genehmigt, wenn eine englische (US) Bestellung unter 500 oder eine japanische Bestellung unter 50000 liegt. Jede andere Bestellung, auch jede chinesische, wartet hier auf Sie.",
  },
  workspaceTitle: { label: "Pet-Store-Verwaltung" },
  signedInAs: { label: "Angemeldet als Administrator" },
  crumbHome: { label: "Startseite" },
  crumbAdministration: { label: "Verwaltung" },
  crumbOrders: { label: "Bestellverwaltung" },
  refreshButton: { label: "Aktualisieren" },
  aboutButton: { label: "Info" },
  exitButton: { label: "Beenden" },
  ordersSegment: { label: "Bestellungen" },
  salesSegment: { label: "Verkäufe" },
  pendingTab: { label: "Ausstehende Bestellungen bearbeiten" },
  nonPendingTab: { label: "Nicht ausstehende Bestellungen anzeigen" },
  selectedCount: { label: "{count} ausgewählt" },
  approveButton: { label: "Genehmigen" },
  denyButton: { label: "Ablehnen" },
  commitButton: { label: "Entscheidungen übernehmen" },
  decisionSummary: { label: "{approve} zu genehmigen · {deny} abzulehnen" },
  columnId: { label: "ID" },
  columnUser: { label: "Benutzer-ID" },
  columnDate: { label: "Datum" },
  columnAmount: { label: "Betrag" },
  columnStatus: { label: "Status" },
  notCommitted: { label: "Nicht übernommen" },
  selectAll: { label: "Alle Bestellungen auswählen" },
  selectOrder: { label: "Bestellung {id} auswählen" },
  statusOfOrder: { label: "Status der Bestellung {id}" },
  pendingFooter: {
    label: "{count} ausstehende Bestellungen · {marked} Entscheidungen nicht übernommen",
  },
  pendingFootNote: {
    label: "Nur der Status kann geändert werden. Es wird erst beim Übernehmen etwas gesendet.",
  },
  nonPendingReadOnly: {
    label:
      "Schreibgeschützt — bereits getroffene Entscheidungen können hier nicht geändert werden.",
  },
  nonPendingFooter: { label: "{count} Bestellungen" },
  busyLoading: { label: "Daten werden vom Server abgerufen..." },
  busyUpdating: { label: "Daten auf dem Server werden aktualisiert..." },
  refreshWarningTitle: { label: "Nicht übernommene Entscheidungen verwerfen?" },
  refreshWarningText: {
    label: "Die Daten sind nicht übernommen. Möchten Sie wirklich aktualisieren?",
  },
  refreshWarningNote: {
    label: "Die {count} markierten Bestellungen ({ids}) werden wieder als PENDING angezeigt.",
  },
  cancelButton: { label: "Abbrechen" },
  discardRefreshButton: { label: "Verwerfen und aktualisieren" },
  aboutTitle: { label: "Über die Pet-Store-Verwaltung" },
  aboutText: {
    label:
      "Bestellverwaltungs-Client für den Pet Store. Entscheidungen wirken erst nach dem Übernehmen.",
  },
  closeButton: { label: "Schließen" },
  fatalTitle: { label: "Schwerer Fehler!" },
  fatalSignOutButton: { label: "Abmelden" },
  pieTab: { label: "Kreisdiagramm" },
  barTab: { label: "Balkendiagramm" },
  startDateLabel: { label: "Startdatum" },
  endDateLabel: { label: "Enddatum" },
  getDataButton: { label: "Daten abrufen" },
  dateFormatMessage: { label: "Datumsangaben müssen das Format MM/dd/yyyy haben" },
  dateHint: { label: "Datumsformat MM/dd/yyyy · alle Bestellstatus eingeschlossen" },
  pieTitle: { label: "Gesamtanteil der Verkäufe in % je Kategorie" },
  pieCaption: { label: "Umsatzanteil, {start} – {end}" },
  barTitle: { label: "Gesamtzahl der Verkäufe je Kategorie" },
  barCaption: { label: "Bestellungen, {start} – {end}" },
  columnCategory: { label: "Kategorie" },
  columnRevenue: { label: "Umsatz" },
  columnShare: { label: "Anteil" },
  columnOrders: { label: "Bestellungen" },
  totalLabel: { label: "Gesamt" },
  noChartData: { label: "Keine Daten für diesen Zeitraum." },
  currencyNote: {
    label: "Jede Bestellung zählt mit ihren eigenen Preisen; keine Währungsumrechnung.",
  },
};
