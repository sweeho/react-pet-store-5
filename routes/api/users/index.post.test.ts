import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import getUser from "./[id]";
import createUser from "./index.post";

/**
 * INTEGRATION TEST
 *
 * SD-7: no account-creation endpoint exists yet, so the UTF-8 round-trip
 * (SWHR-R-0021) is verified through this demo `users` resource, the only
 * account-shaped write path in the repository.
 *
 * The POST call goes through `createUser.fetch(request)` (the `.fetch`
 * h3 attaches to every handler, see routes/api/hello.test.ts's sibling
 * pattern) rather than a bare `createUser(event)`, so the response is a
 * real `Response` object — the only way to assert on its actual
 * Content-Type header. The GET call instead builds a raw H3Event with
 * `context.params` set directly (routes/api/users/[id].test.ts's pattern),
 * because `.fetch` never runs the router and so never populates
 * `context.params` for a dynamic route.
 */
describe("POST /api/users", () => {
  it("[AC-2] round-trips a Japanese name byte-identical through create and read", async () => {
    const name = "田中太郎";

    const createResponse = await createUser.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email: "tanaka@example.com" }),
      }),
    );

    expect(createResponse.status).toBe(201);
    expect(createResponse.headers.get("content-type")?.toLowerCase()).toContain("charset=utf-8");

    const created = await createResponse.json();
    expect(created).toEqual({ id: expect.any(Number), name, email: "tanaka@example.com" });

    const getEvent = new H3Event(new Request(`http://localhost/api/users/${created.id}`), {
      params: { id: String(created.id) },
    });
    const { user } = await getUser(getEvent);

    expect(user.name).toBe(name);
  });

  it("round-trips a Chinese name byte-identical through create and read", async () => {
    const name = "王小明";

    const createResponse = await createUser.fetch(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email: "wang@example.com" }),
      }),
    );

    const created = await createResponse.json();
    expect(created.name).toBe(name);

    const getEvent = new H3Event(new Request(`http://localhost/api/users/${created.id}`), {
      params: { id: String(created.id) },
    });
    const { user } = await getUser(getEvent);

    expect(user.name).toBe(name);
  });

  it("rejects a request missing name or email", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "No Email" }),
      }),
    );

    await expect(createUser(event)).rejects.toMatchObject({ status: 400 });
  });
});
