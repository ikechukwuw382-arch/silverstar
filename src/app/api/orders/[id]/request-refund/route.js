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

    const { id: orderId } = await params;
const { reason, bankName, accountName, accountNo } = await req.json();

    if (!reason || !reason.trim()) {
      return Response.json({ error: 'Please tell us why you want a refund.' }, { status: 400 });
    }
if (!bankName?.trim() || !accountName?.trim() || !accountNo?.trim()) {
      return Response.json({ error: 'Please provide your bank name, account name, and account number.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        refund: true,
        items: {
          include: { listing: { include: { vendor: { select: { email: true, name: true } } } } },
        },
      },
    });

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.userId) {
      return Response.json({ error: 'Not your order' }, { status: 403 });
    }

    if (order.status === 'Order Placed') {
      return Response.json(
        { error: 'This order hasn\u2019t been confirmed yet \u2014 you can just cancel it instead.' },
        { status: 400 }
      );
    }

    if (order.status === 'Cancelled') {
      return Response.json({ error: 'This order is already cancelled.' }, { status: 400 });
    }

    if (order.refund) {
      return Response.json(
        { error: 'A refund request already exists for this order.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.refundRequest.create({
        data: {
          orderId: order.id,
          reason: reason.trim(),
refundBankName: bankName.trim(),
          refundAccountName: accountName.trim(),
          refundAccountNo: accountNo.trim(),
          status: 'REQUESTED',
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { refundStatus: 'REQUESTED' },
      });
    });

    const vendors = new Map();
    for (const item of order.items) {
      const v = item.listing.vendor;
      if (v?.email && !vendors.has(v.email)) vendors.set(v.email, v.name);
    }

    for (const [email, name] of vendors) {
      await sendEmail({
        to: email,
        subject: `Refund requested for order #${orderId.slice(-6).toUpperCase()}`,
        html: `
          <h2>Hi ${name || 'there'},</h2>
          <p>The customer has requested a refund for order #${orderId.slice(-6).toUpperCase()}.</p>
          <p><strong>Reason:</strong> ${reason.trim()}</p>
          <p>Please visit your dashboard to process this refund.</p>
        `,
      });
    }

    return Response.json({ success: true, refundStatus: 'REQUESTED' });
  } catch (err) {
    console.error('Request refund failed:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
