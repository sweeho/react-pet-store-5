import { createError, defineHandler, readBody } from "nitro/h3";

import { db } from "../../../db/client";
import { users } from "../../../db/schema";

export default defineHandler(async (event) => {
  const body = await readBody<{ name?: unknown; email?: unknown }>(event);
  const name = typeof body?.name === "string" ? body.name : "";
  const email = typeof body?.email === "string" ? body.email : "";

  if (!name || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: "name and email are required",
    });
  }

  const user = db.insert(users).values({ name, email }).returning().get();

  event.res.status = 201;
  return user;
});
