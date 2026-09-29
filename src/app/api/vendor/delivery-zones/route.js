import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function requireApprovedVendor(session) {
  if (!session) {
    return { error: "You must be logged in.", status: 401 };
  }
  if (session.role !== "vendor" && session.role !== "admin") {
    return { error: "Only vendors can manage delivery zones.", status: 403 };
  }
  if (session.role === "vendor") {
    const kyc = await prisma.kyc.findUnique({
      where: { userId: session.userId },
      select: { status: true },
    });
    if (!kyc || kyc.status !== "approved") {
      return {
        error: "Your identity verification must be approved before you can manage delivery zones.",
        status: 403,
      };
    }
  }
  return null;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const zones = await prisma.vendorDeliveryZone.findMany({
      where: { vendorId: session.userId },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({ zones });
  } catch (error) {
    console.error("FETCH DELIVERY ZONES ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    const authError = await requireApprovedVendor(session);
    if (authError) {
      return Response.json({ error: authError.error }, { status: authError.status });
    }

    const { areaName, fee } = await request.json();

    const cleanedAreaName = String(areaName || "").trim();
    if (!cleanedAreaName) {
      return Response.json({ error: "Please enter an area name." }, { status: 400 });
    }
    if (cleanedAreaName.length > 60) {
      return Response.json({ error: "Area name must be 60 characters or less." }, { status: 400 });
    }

    const cleanedFee = Number(fee);
    if (!Number.isFinite(cleanedFee) || cleanedFee < 0) {
      return Response.json({ error: "Please enter a valid delivery fee." }, { status: 400 });
    }

    const zone = await prisma.vendorDeliveryZone.create({
      data: {
        vendorId: session.userId,
        areaName: cleanedAreaName,
        fee: Math.round(cleanedFee),
      },
    });

    return Response.json({ success: true, zone });
  } catch (error) {
    console.error("CREATE DELIVERY ZONE ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
