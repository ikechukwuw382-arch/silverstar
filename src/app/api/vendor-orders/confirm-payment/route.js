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

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return Response.json({ error: 'Only vendors can confirm or reject payment.' }, { status: 403 });
    }

    if (session.role === 'vendor') {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== 'approved') {
        return Response.json(
          { error: 'Your identity verification must be approved before you can confirm payments.' },
          { status: 403 }
        );
      }
    }

    const { orderId, action, reason } = await req.json();

    if (!orderId || !['confirm', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'reject' && (!reason || !reason.trim())) {
      return Response.json({ error: 'Please explain why this payment is being rejected.' }, { status: 400 });
    }

    // Confirm this vendor actually has an item in this order
    const hasItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        listing: { vendorId: session.userId },
      },
    });

    if (!hasItem) {
      return Response.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'PAYMENT_SUBMITTED') {
      return Response.json(
        { error: 'This order has no pending payment to review.' },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data:
        action === 'confirm'
          ? { paymentStatus: 'PAID', paymentRejectedReason: null }
          : { paymentStatus: 'PAYMENT_REJECTED', paymentRejectedReason: reason.trim() },
    });

    return Response.json({ success: true, order: updated });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
