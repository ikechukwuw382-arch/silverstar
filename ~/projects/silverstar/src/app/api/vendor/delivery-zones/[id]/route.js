import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.role !== "vendor" && session.role !== "admin") {
      return Response.json({ error: "Only vendors can manage delivery zones." }, { status: 403 });
    }

    const { id } = await params;

    const zone = await prisma.vendorDeliveryZone.findUnique({ where: { id } });
    if (!zone) {
      return Response.json({ error: "Delivery zone not found." }, { status: 404 });
    }
    if (zone.vendorId !== session.userId && session.role !== "admin") {
      return Response.json({ error: "You can only remove your own delivery zones." }, { status: 403 });
    }

    await prisma.vendorDeliveryZone.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE DELIVERY ZONE ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
