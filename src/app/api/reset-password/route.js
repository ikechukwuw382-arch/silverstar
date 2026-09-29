import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return Response.json({ error: "Token and new password are required." }, { status: 400 });
    }

const strongEnough =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!strongEnough) {
      return Response.json(
        { error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!resetRecord) {
      return Response.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }

    if (resetRecord.expiresAt < new Date()) {
      return Response.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Delete the token so it can't be reused
    await prisma.passwordResetToken.delete({
      where: { userId: resetRecord.userId },
    });

    return Response.json({ success: true });
} catch (error) {
    fs.writeFileSync("error-log.txt", String(error?.stack || error));
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
