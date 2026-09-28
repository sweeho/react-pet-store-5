import { defineHandler, getRequestURL, redirect } from "nitro/h3";

import { checkGate } from "../lib/auth/protection";

// A page route has no file extension (vite-plugin-pages); an asset request
// (js/css/svg/…) does. Skipping both /api and asset requests confines the
// gate to the storefront's own document navigations (design.md P6).
const ASSET_PATTERN = /\.[a-zA-Z0-9]+$/;

export default defineHandler(async (event) => {
  const url = getRequestURL(event);
  if (url.pathname.startsWith("/api") || ASSET_PATTERN.test(url.pathname)) {
    return;
  }

  const result = await checkGate(event, url.pathname + url.search);
  if (!result.allowed) {
    return redirect(result.redirect, 302);
  }
});
