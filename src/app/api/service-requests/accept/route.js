import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    if (session.role !== "vendor" && session.role !== "admin") {
      return Response.json({ error: 'Only vendors can accept service requests' }, { status: 403 });
    }

    if (session.role === "vendor") {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== "approved") {
        return Response.json(
          { error: 'Your identity verification must be approved before you can accept service requests.' },
          { status: 403 }
        );
      }
    }

    const { requestId } = await req.json();

    const existing = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!existing) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }
    if (existing.customerId === session.userId) {
      return Response.json({ error: 'You cannot accept a service request you submitted yourself.' }, { status: 403 });
    }
    if (existing.engineerId && existing.engineerId !== session.userId) {
      return Response.json({ error: 'Already assigned to another engineer' }, { status: 409 });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { engineerId: session.userId, status: 'Engineer Assigned' },
    });

    return Response.json({ success: true, request: updated });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
