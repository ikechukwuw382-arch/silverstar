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

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    // Only orders that are both not cancelled AND actually paid count as
    // real, confirmed revenue — an order that was placed but never paid
    // for is not a sale yet, the same standard now applied to vendor
    // settlement eligibility.
    const orders = await prisma.order.aggregate({
      where: { status: { not: 'Cancelled' }, paymentStatus: 'PAID' },
      _sum: { subtotal: true, deliveryFee: true },
      _count: true,
    });

    const commission = await prisma.orderItem.aggregate({
      where: { order: { status: { not: 'Cancelled' }, paymentStatus: 'PAID' } },
_sum: { commissionAmount: true, vendorNetAmount: true },
    });

    const payoutSums = await prisma.orderItem.groupBy({
      by: ['payoutStatus'],
      where: { order: { status: { not: 'Cancelled' }, paymentStatus: 'PAID' } },
_sum: { commissionAmount: true },
    });
const payouts = {
  OUTSTANDING: 0,
  SUBMITTED: 0,
  SETTLED: 0,
};

    for (const row of payoutSums) {
      if (Object.prototype.hasOwnProperty.call(payouts, row.payoutStatus)) {
payouts[row.payoutStatus] = row._sum.commissionAmount || 0;
      }
    }

    const config = await prisma.platformConfig.findUnique({ where: { id: 'default' } });

    return Response.json({
      totalSales: orders._sum.subtotal || 0,
      totalDeliveryFees: orders._sum.deliveryFee || 0,
      totalOrders: orders._count,
      totalCommission: commission._sum.commissionAmount || 0,
      totalVendorEarnings: commission._sum.vendorNetAmount || 0,
      payouts,
      commissionRate: config?.commissionRate ?? 3,
    });
  } catch (error) {
    console.error('ADMIN FINANCE GET ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const { commissionRate } = await request.json();

    if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 100) {
      return Response.json({ error: 'Commission rate must be a number between 0 and 100.' }, { status: 400 });
    }

    const updated = await prisma.platformConfig.upsert({
      where: { id: 'default' },
      update: { commissionRate },
      create: { id: 'default', commissionRate },
    });

    return Response.json({ success: true, config: updated });
  } catch (error) {
    console.error('ADMIN FINANCE PATCH ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
