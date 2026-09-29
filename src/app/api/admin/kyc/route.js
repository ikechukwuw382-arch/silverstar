import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const submissions = await prisma.kyc.findMany({
      where: { status: "pending" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ submissions });
  } catch (error) {
    console.error("ADMIN KYC LIST ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const { kycId, decision } = await request.json();

    if (!kycId || !["approved", "rejected"].includes(decision)) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    const updated = await prisma.kyc.update({
      where: { id: kycId },
      data: { status: decision },
    });

    return Response.json({ success: true, kyc: updated });
  } catch (error) {
    console.error("ADMIN KYC UPDATE ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
