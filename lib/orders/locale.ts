import { getDefaultLocale, type LocaleId } from "../locale/model";

/**
 * Order locale defaults to en_US when absent (D5, P6). Unlike session/page
 * resolution, the value is stored as given — checkout (swhr-i-0009) is
 * responsible for validating it before it reaches this contract.
 */
export function normaliseOrderLocale(input?: string | null): LocaleId {
  if (!input) {
    return getDefaultLocale();
  }

  return input;
}
