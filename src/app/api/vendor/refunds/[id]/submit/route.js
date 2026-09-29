import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

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

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return Response.json({ error: 'Only vendors can submit a refund.' }, { status: 403 });
    }

    const { id: orderId } = await params;
    const { bankReference, receiptImagePath, vendorNote } = await req.json();

    if (!bankReference || !bankReference.trim()) {
      return Response.json({ error: 'A bank reference is required.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        refund: true,
        user: { select: { email: true, name: true } },
        items: { include: { listing: { select: { vendorId: true } } } },
      },
    });

    if (!order || !order.refund) {
      return Response.json({ error: 'No refund request found for this order.' }, { status: 404 });
    }

    const ownsOrder = order.items.some((item) => item.listing.vendorId === session.userId);
    if (!ownsOrder && session.role !== 'admin') {
      return Response.json({ error: 'This order does not belong to you.' }, { status: 403 });
    }

    if (order.refund.status !== 'REQUESTED') {
      return Response.json(
        { error: 'This refund has already been submitted or confirmed.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.refundRequest.update({
        where: { orderId: order.id },
        data: {
          status: 'SUBMITTED',
          bankReference: bankReference.trim(),
          receiptImagePath: receiptImagePath || null,
          vendorNote: vendorNote?.trim() || null,
          submittedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { refundStatus: 'SUBMITTED' },
      });
    });

    if (order.user?.email) {
      await sendEmail({
        to: order.user.email,
        subject: `Your refund for order #${orderId.slice(-6).toUpperCase()} has been sent`,
        html: `
          <h2>Hi ${order.user.name || 'there'},</h2>
          <p>The seller has sent your refund for order #${orderId.slice(-6).toUpperCase()}.</p>
          <p>Please check your bank account, then confirm receipt from your order page.</p>
        `,
      });
    }

    return Response.json({ success: true, refundStatus: 'SUBMITTED' });
  } catch (err) {
    console.error('Submit refund failed:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
