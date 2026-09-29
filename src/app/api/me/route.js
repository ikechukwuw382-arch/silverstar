import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return Response.json({ loggedIn: false });
  }

  const session = await verifySession(token);
  if (!session) {
    return Response.json({ loggedIn: false });
  }

const userRecord = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { savedPhone: true, savedState: true, savedCity: true, savedAddress: true, savedInstructions: true, name: true },
  });

  let kycStatus = null;
if (session.role === "vendor" || session.role === "admin") {
    const kyc = await prisma.kyc.findUnique({
      where: { userId: session.userId },
      select: { status: true },
    });
    kycStatus = kyc?.status || "not_submitted";
  }

  return Response.json({
    loggedIn: true,
    userId: session.userId,
    role: session.role,
    kycStatus,
savedAddress: {
      fullName: userRecord?.name || "",
      phone: userRecord?.savedPhone || "",
      state: userRecord?.savedState || "",
      city: userRecord?.savedCity || "",
      address: userRecord?.savedAddress || "",
      instructions: userRecord?.savedInstructions || "",
    },
  });
}

