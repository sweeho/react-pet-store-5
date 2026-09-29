import type { AccountView } from "../../lib/account/view";

export interface AccountState {
  account: AccountView | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAccount(): AccountState {
  throw new Error("VortexNotImplemented");
}
