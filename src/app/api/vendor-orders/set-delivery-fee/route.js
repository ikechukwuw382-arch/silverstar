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
      return Response.json({ error: 'Only vendors can set a delivery fee.' }, { status: 403 });
    }

    if (session.role === 'vendor') {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== 'approved') {
        return Response.json(
          { error: 'Your identity verification must be approved before you can manage orders.' },
          { status: 403 }
        );
      }
    }

    const { orderId, deliveryFee } = await req.json();

    if (deliveryFee == null || Number(deliveryFee) < 0) {
      return Response.json({ error: 'Invalid delivery fee' }, { status: 400 });
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

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const newTotal = order.subtotal + Number(deliveryFee);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryFee: Number(deliveryFee),
        totalAmount: newTotal,
      },
    });

    return Response.json({ success: true, order: updated });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
