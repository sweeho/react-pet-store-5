import { definePlugin } from "nitro";

import { loadNotificationSwitches } from "../lib/notifications/config";

/** Validates the notification switches at server start; a bad file stops the server. */
export default definePlugin(() => {
  loadNotificationSwitches();
});
