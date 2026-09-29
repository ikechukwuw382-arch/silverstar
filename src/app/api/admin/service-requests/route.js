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
    const requests = await prisma.serviceRequest.findMany({
      include: {
        customer: { select: { name: true, email: true } },
        engineer: { select: { name: true, email: true } },
        quote: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ requests });
  } catch (error) {
    console.error("ADMIN SERVICE REQUESTS LIST ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
