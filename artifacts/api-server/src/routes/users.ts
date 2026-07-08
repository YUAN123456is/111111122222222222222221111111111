import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { RegisterUserBody, RegisterUserResponse, LoginUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) { reject(err); return; }
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) { reject(err); return; }
      resolve(timingSafeEqual(Buffer.from(hash, "hex"), derivedKey));
    });
  });
}

router.post("/users/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  // Email-based registration
  if (data.authProvider === "email") {
    if (!data.email || !data.password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [existingByEmail] = await db.select().from(usersTable).where(eq(usersTable.email, data.email));
    if (existingByEmail) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(data.password);
    const deviceId = data.deviceId || `email_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const [created] = await db
      .insert(usersTable)
      .values({
        deviceId,
        authProvider: "email",
        email: data.email,
        passwordHash,
        displayName: data.displayName ?? null,
      })
      .returning();

    res.json(RegisterUserResponse.parse(created));
    return;
  }

  // OAuth / Guest registration (device-based)
  if (!data.deviceId) {
    res.status(400).json({ error: "deviceId is required for non-email registration" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.deviceId, data.deviceId));
  if (existing) {
    res.json(RegisterUserResponse.parse(existing));
    return;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      deviceId: data.deviceId,
      authProvider: data.authProvider,
    })
    .returning();

  res.json(RegisterUserResponse.parse(created));
});

router.post("/users/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, parsed.data.email), eq(usersTable.authProvider, "email")));

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json(RegisterUserResponse.parse(user));
});

router.delete("/users/:userId", async (req, res): Promise<void> => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

export default router;
