import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'admin') return null;
  return session;
}

const VALID_TYPES = ['sales', 'commission', 'vendorNet', 'deliveryFees', 'outstanding', 'submitted', 'settled'];

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!VALID_TYPES.includes(type)) {
    return Response.json({ error: 'Invalid drilldown type.' }, { status: 400 });
  }

  try {
    if (type === 'sales' || type === 'deliveryFees') {
      const orders = await prisma.order.findMany({
        where: { status: { not: 'Cancelled' } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          status: true,
          subtotal: true,
          deliveryFee: true,
          createdAt: true,
        },
      });
      return Response.json({
        type,
        rows: orders.map((o) => ({
          orderId: o.id,
          customer: o.fullName,
          orderStatus: o.status,
          amount: type === 'sales' ? o.subtotal : o.deliveryFee,
          createdAt: o.createdAt,
        })),
      });
    }

    // Everything else is item-level: commission, vendorNet, or a payoutStatus bucket

const payoutStatusMap = {
  outstanding: 'OUTSTANDING',
  submitted: 'SUBMITTED',
  settled: 'SETTLED',
};

    const where = { order: { status: { not: 'Cancelled' } } };
    if (payoutStatusMap[type]) {
      where.payoutStatus = payoutStatusMap[type];
    }

    const items = await prisma.orderItem.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        order: { select: { id: true, fullName: true, status: true, createdAt: true } },
        listing: { select: { title: true, vendorId: true, vendor: { select: { name: true } } } },
      },
    });

    return Response.json({
      type,
      rows: items.map((i) => ({
        orderId: i.order.id,
        customer: i.order.fullName,
        orderStatus: i.order.status,
        itemTitle: i.listing.title,
        vendorName: i.listing.vendor?.name || 'Unknown vendor',
amount: type === 'commission' ? i.commissionAmount : type === 'vendorNet' ? i.vendorNetAmount : i.commissionAmount,
        payoutStatus: i.payoutStatus,
        createdAt: i.order.createdAt,
      })),
    });
  } catch (error) {
    console.error('ADMIN FINANCE DRILLDOWN ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
