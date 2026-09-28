import { H3Event } from "nitro/h3";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { cartLines, sessions } from "../../db/schema";
import { getAuthSession, updateAuthSession } from "../../lib/auth/session";
import { addCartItem, listCartLines } from "../../lib/cart/lines";
import { getSessionLocale, setSessionLocale } from "../../lib/locale/session";
import postSignoff from "./signoff.post";

beforeEach(() => {
  db.delete(cartLines).run();
  db.delete(sessions).run();
});

function cookieFrom(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("POST /api/signoff", () => {
  /** SWHR-R-0073.01 — server half of SWHR-C-0135 (SWHR-T-0048 drives the browser flow). */
  it("ends the signed-on session, empties the cart and keeps the locale", async () => {
    const setup = new H3Event(new Request("http://localhost/"));
    await setSessionLocale(setup, "ja_JP");
    const session = await updateAuthSession(setup, "storefront", {
      userId: "alice",
      signedOn: true,
    });
    addCartItem(session.id, "EST-6");
    addCartItem(session.id, "EST-7");
    addCartItem(session.id, "EST-8");
    expect(listCartLines(session.id)).toHaveLength(3);

    const event = new H3Event(
      new Request("http://localhost/api/signoff", {
        method: "POST",
        headers: { cookie: cookieFrom(setup) },
      }),
    );
    const result = await postSignoff(event);

    expect(result).toEqual({ redirect: "/signed-out" });
    expect(listCartLines(session.id)).toHaveLength(0);

    const nextEvent = new H3Event(
      new Request("http://localhost/", { headers: { cookie: cookieFrom(event) } }),
    );
    const after = await getAuthSession(nextEvent, "storefront");
    expect(after.signedOn).toBe(false);
    expect(after.id).not.toBe(session.id);
    await expect(getSessionLocale(nextEvent)).resolves.toBe("ja_JP");
  });
});
