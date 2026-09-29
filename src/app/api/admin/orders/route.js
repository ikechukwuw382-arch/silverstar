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
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            listing: {
              include: {
                vendor: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ orders });
  } catch (error) {
    console.error("ADMIN ORDERS LIST ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
