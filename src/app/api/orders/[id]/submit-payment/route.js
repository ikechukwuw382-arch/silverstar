import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function PATCH(req, { params }) {
  try {
    const { id: orderId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { paymentReference, proofImagePath } = await req.json();

    if (!paymentReference || !paymentReference.trim()) {
      return Response.json({ error: 'Please enter your payment reference or transaction ID.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { listing: true } } },
    });

    if (!order || order.userId !== session.userId) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'UNPAID' && order.paymentStatus !== 'PAYMENT_REJECTED') {
      return Response.json({ error: 'Payment has already been submitted for this order.' }, { status: 400 });
    }

    const vendorId = order.items[0]?.listing?.vendorId;
    const cleanedReference = paymentReference.trim();

    // Fraud check: block reusing the same payment reference against the same vendor
    if (vendorId) {
      const duplicate = await prisma.order.findFirst({
        where: {
          id: { not: order.id },
          paymentReference: cleanedReference,
          paymentStatus: { in: ['PAYMENT_SUBMITTED', 'PAID'] },
          items: { some: { listing: { vendorId } } },
        },
      });

      if (duplicate) {
        return Response.json(
          { error: 'This payment reference has already been used on another order.' },
          { status: 400 }
        );
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentReference: cleanedReference,
        proofImagePath: proofImagePath || null,
        paymentStatus: 'PAYMENT_SUBMITTED',
        paymentSubmittedAt: new Date(),
        paymentRejectedReason: null,
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
