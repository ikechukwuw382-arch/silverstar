import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.suspended) {
      return Response.json({ error: "This account has been suspended. Contact support for help." }, { status: 403 });
    }

    const token = await createSession({ userId: user.id, role: user.role });

    const response = Response.json({ success: true, userId: user.id, name: user.name });
    response.headers.set(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
    );
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return Response.json({ error: "Something went wrong.", details: error.message }, { status: 500 });
  }
}
