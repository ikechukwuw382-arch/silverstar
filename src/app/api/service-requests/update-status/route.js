import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const validStatuses = ["On the Way", "Diagnosing", "Repairing", "Completed"];

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { requestId, status } = await req.json();

    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { quote: true },
    });

    if (!existing || existing.engineerId !== session.userId) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // "Repairing" can only be reached once the customer's payment is actually
    // confirmed — it is normally set automatically by /quote/confirm-payment.
    // This blocks it from being picked manually to skip that gate.
    if (status === 'Repairing' && existing.quote?.paymentStatus !== 'PAID') {
      return Response.json(
        { error: 'You can only start repair work after confirming the customer\'s payment.' },
        { status: 400 }
      );
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return Response.json({ success: true, request: updated });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
