import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { shopBio: true, businessName: true, profilePicUrl: true },
    });

    return Response.json({ shopBio: user?.shopBio || "", businessName: user?.businessName || "", profilePicUrl: user?.profilePicUrl || "" });
  } catch (error) {
    console.error("FETCH SHOP BIO ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    if (session.role !== "vendor" && session.role !== "admin") {
      return Response.json({ error: "Only vendors can edit a shop bio." }, { status: 403 });
    }

    if (session.role === "vendor") {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== "approved") {
        return Response.json(
          { error: "Your identity verification must be approved before you can edit your shop." },
          { status: 403 }
        );
      }
    }

    const { shopBio, businessName, profilePicUrl } = await request.json();

    if (shopBio && shopBio.length > 300) {
      return Response.json({ error: "Bio must be 300 characters or less." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { shopBio: shopBio || null, businessName: businessName || null, profilePicUrl: profilePicUrl || null },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("UPDATE SHOP BIO ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
