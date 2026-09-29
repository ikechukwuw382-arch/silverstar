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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.status !== 'Order Placed') {
      return Response.json(
        { error: 'This order can no longer be cancelled — the seller has already started processing it.' },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'Cancelled' },
    });

    // Notify each distinct vendor whose items were in this order
    const vendors = new Map();
    for (const item of order.items) {
      const v = item.listing.vendor;
      if (v?.email && !vendors.has(v.email)) vendors.set(v.email, v.name);
    }

    for (const [email, name] of vendors) {
      await sendEmail({
        to: email,
        subject: `Order #${orderId.slice(-6).toUpperCase()} was cancelled by the customer`,
        html: `
          <h2>Hi ${name || 'there'},</h2>
          <p>The customer cancelled order #${orderId.slice(-6).toUpperCase()} before it was confirmed. No action is needed on your end.</p>
        `,
      });
    }

    return Response.json({ success: true, status: 'Cancelled' });
  } catch (err) {
    console.error('Cancel order failed:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
