import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { refund: true },
    });

    if (!order || !order.refund) {
      return Response.json({ error: 'No refund found for this order.' }, { status: 404 });
    }

    if (order.userId !== session.userId) {
      return Response.json({ error: 'Not your order' }, { status: 403 });
    }

    if (order.refund.status !== 'SUBMITTED') {
      return Response.json(
        { error: 'This refund hasn\u2019t been sent yet, or has already been confirmed.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.refundRequest.update({
        where: { orderId: order.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { refundStatus: 'CONFIRMED' },
      });
    });

    return Response.json({ success: true, refundStatus: 'CONFIRMED' });
  } catch (err) {
    console.error('Confirm refund failed:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
