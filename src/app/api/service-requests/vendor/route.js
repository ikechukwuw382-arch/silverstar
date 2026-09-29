import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return Response.json({ error: 'Only vendors can view service requests.' }, { status: 403 });
    }

    if (session.role === 'vendor') {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== 'approved') {
        return Response.json(
          { error: 'Your identity verification must be approved before you can view service requests.' },
          { status: 403 }
        );
      }
    }

    // Unassigned requests (available to accept) + requests this vendor already accepted
    const requests = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          { engineerId: null },
          { engineerId: session.userId },
        ],
      },
      include: { quote: true, customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ requests });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
