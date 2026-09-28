import { defineHandler } from "nitro/h3";

import { getProtectionConfig } from "../../../lib/auth/protection";

// The SPA fetches this once so a new protected page is a config change, not
// a code change (design.md P6): only listed paths are ever asked about
// through GET /api/signon/gate.
export default defineHandler(() => {
  const config = getProtectionConfig();
  return {
    signOnPage: config.signOnPage,
    protectedPaths: config.protectedPages.map((page) => page.path),
  };
});
