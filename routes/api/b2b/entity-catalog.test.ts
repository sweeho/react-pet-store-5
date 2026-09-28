import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { BUNDLED_SCHEMA_CATALOG } from "../../../lib/b2b/schemas/catalog";
import getEntityCatalog from "./entity-catalog.get";

describe("GET /api/b2b/entity-catalog", () => {
  it("publishes every catalog identifier mapped to its schema URL", async () => {
    const event = new H3Event(new Request("http://localhost/api/b2b/entity-catalog"));

    const body = (await getEntityCatalog(event)) as string;

    for (const entry of BUNDLED_SCHEMA_CATALOG) {
      expect(body).toContain(`${entry.identifier}=/api/b2b/schemas/${entry.file}`);
    }
  });
});
