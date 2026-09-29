import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const validStatuses = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
];

// These statuses mean the order is physically moving to the customer —
// payment must be confirmed by the vendor before either can be set.
const shippingStatuses = ["Out for Delivery", "Delivered"];

// Only these are real milestones worth emailing a customer about —
// "Preparing" / "Ready for Delivery" are internal micro-steps, not
// moments a buyer needs to be interrupted for.
const notifiableStatuses = {
  Confirmed: {
    subject: (orderId) => `Your Silverstar order #${orderId.slice(-6).toUpperCase()} has been confirmed`,
    body: (name) => `
      <h2>Good news, ${name}!</h2>
      <p>The seller has confirmed your order and is getting it ready.</p>
      <p>You'll get another email once it's out for delivery.</p>
    `,
  },
  "Out for Delivery": {
    subject: (orderId) => `Your Silverstar order #${orderId.slice(-6).toUpperCase()} is on its way`,
    body: (name) => `
      <h2>On the way, ${name}!</h2>
      <p>Your order has left the seller and is out for delivery. It should reach you soon.</p>
    `,
  },
  Delivered: {
    subject: (orderId) => `Your Silverstar order #${orderId.slice(-6).toUpperCase()} has arrived`,
    body: (name) => `
      <h2>Delivered!</h2>
      <p>Hi ${name}, your order has been marked as delivered. We hope everything is exactly as expected.</p>
      <p>If there's an issue, you can reach out from your order tracking page.</p>
    `,
  },
};

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return Response.json({ error: 'Only vendors can update order status.' }, { status: 403 });
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

    const { orderId, status } = await req.json();

    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Confirm this vendor actually has an item in this order before allowing the update
    const hasItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        listing: { vendorId: session.userId },
      },
    });

    if (!hasItem) {
      return Response.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        paymentStatus: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!existingOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (shippingStatuses.includes(status) && existingOrder.paymentStatus !== 'PAID') {
      return Response.json(
        { error: 'Please confirm the customer\'s payment before marking this order as shipped or delivered.' },
        { status: 403 }
      );
    }

    const statusActuallyChanged = existingOrder.status !== status;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Payout eligibility trigger: once this vendor's items are actually delivered,
    // move only THIS vendor's items on THIS order from NOT_ELIGIBLE to AVAILABLE_FOR_PAYOUT.
    if (status === 'Delivered') {
      await prisma.orderItem.updateMany({
        where: {
          orderId,
          listing: { vendorId: session.userId },
          payoutStatus: 'NOT_ELIGIBLE',
        },
        data: { payoutStatus: 'AVAILABLE_FOR_PAYOUT' },
      });
    }

    // Notify the customer only on a real transition into a milestone status —
    // never on a no-op update (e.g. vendor re-saving the same status).
    if (statusActuallyChanged && notifiableStatuses[status] && existingOrder.user?.email) {
      const template = notifiableStatuses[status];
      await sendEmail({
        to: existingOrder.user.email,
        subject: template.subject(orderId),
        html: template.body(existingOrder.user.name || 'there'),
      });
    }

    return Response.json({ success: true, order: updated });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
