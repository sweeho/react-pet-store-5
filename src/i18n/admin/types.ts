export interface AdminStringEntry {
  label: string;
  tooltip?: string;
  mnemonic?: string;
}

export type AdminStrings = Record<string, AdminStringEntry>;
