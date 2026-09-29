import { DependencyResolutionError } from "./errors";
import { CHANNELS, type Channel } from "./outbox";

/**
 * Resolves a configured channel name, failing at once with no fallback when
 * it is not in `registry` (defaults to the outbox's channels).
 */
export function resolveChannel(name: string, registry: readonly string[] = CHANNELS): Channel {
  if (!registry.includes(name)) {
    throw new DependencyResolutionError(name, new Error(`channel "${name}" is not configured`));
  }
  return name as Channel; // membership in the registry was just checked
}
