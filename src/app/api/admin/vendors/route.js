import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const vendors = await prisma.user.findMany({
      where: { role: 'vendor' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        suspended: true,
        createdAt: true,
        kyc: { select: { status: true } },
        listings: { where: { status: 'active' }, select: { id: true } },
      },
    });

    const result = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      email: v.email,
      suspended: v.suspended,
      createdAt: v.createdAt,
      kycStatus: v.kyc?.status || 'not submitted',
      activeListings: v.listings.length,
    }));

    return Response.json({ vendors: result });
  } catch (error) {
    console.error('ADMIN VENDORS GET ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const { vendorId, suspended } = await request.json();

    if (!vendorId || typeof suspended !== 'boolean') {
      return Response.json({ error: 'vendorId and suspended (boolean) are required.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: vendorId },
      data: { suspended },
    });

    return Response.json({ success: true, vendorId: updated.id, suspended: updated.suspended });
  } catch (error) {
    console.error('ADMIN VENDORS PATCH ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
