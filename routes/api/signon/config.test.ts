import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import getConfig from "./config.get";

describe("GET /api/signon/config", () => {
  it("returns the sign-on page and the protected path list", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/config"));

    const result = await getConfig(event);

    expect(result.signOnPage).toBe("/signin");
    expect(result.protectedPaths).toEqual(
      expect.arrayContaining(["/account", "/account-edit", "/checkout", "/signon-welcome"]),
    );
  });
});
