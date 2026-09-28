import type { AdminStrings } from "./types";

// German catalogue (design D6/SD-5): the legacy Swing admin client shipped
// petstore_de.properties alongside the English default.
export const de: AdminStrings = {
  title: { label: "Verwaltung", tooltip: "Shopverwaltung", mnemonic: "v" },
  emptyTitle: { label: "Demnächst verfügbar" },
  emptyDescription: { label: "Die Bestellfreigabe ist demnächst verfügbar." },
};
