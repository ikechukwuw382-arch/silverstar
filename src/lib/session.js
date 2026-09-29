import { SignJWT, jwtVerify } from "jose";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-change-me");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function createSession(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, secret);

    // Live check: even a valid, unexpired token is rejected if the
    // account has since been suspended. This makes suspension take
    // effect immediately, not just on the next fresh login.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { suspended: true },
    });

    if (!user || user.suspended) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
