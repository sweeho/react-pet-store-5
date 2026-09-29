import { defineHandler } from "nitro/h3";

import type { CartView } from "../../../../lib/cart/types";

export default defineHandler((): CartView => {
  throw new Error("VortexNotImplemented");
});
