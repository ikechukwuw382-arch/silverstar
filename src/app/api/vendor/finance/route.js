import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return Response.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  try {
    const where = {
      listing: { vendorId: session.userId },
      order: { status: { not: 'Cancelled' } },
    };

    const items = await prisma.orderItem.findMany({
      where,
      include: {
        listing: { select: { title: true } },
        order: { select: { createdAt: true, status: true, paymentStatus: true } },
      },
      orderBy: { id: 'desc' },
    });

    let totalSales = 0;
    let totalCommission = 0;
    let totalNet = 0;
const payouts = { OUTSTANDING: 0, SUBMITTED: 0, SETTLED: 0, PENDING_DELIVERY: 0, READY_TO_SETTLE: 0 };
    const byListing = {};
    const validOrderIds = new Set();

    for (const item of items) {
      // Only count items with real, correctly-calculated commission data.
      // Old pre-fix orders have commissionAmount=0 and vendorNetAmount=0
      // even though a real quantity/price is stored — those are excluded
      // from every figure below (sales, units sold, commission, net,
      // per-listing breakdown) so nothing here ever misrepresents a
      // "sale" that has no trustworthy financial record behind it.
      const isValid = item.commissionAmount > 0 || item.vendorNetAmount > 0;
      if (!isValid) continue;

      const itemSales = item.commissionAmount + item.vendorNetAmount;

      totalSales += itemSales;
      totalCommission += item.commissionAmount;
      totalNet += item.vendorNetAmount;
      validOrderIds.add(item.orderId);

      if (Object.prototype.hasOwnProperty.call(payouts, item.payoutStatus)) {
payouts[item.payoutStatus] += item.commissionAmount;
      }

      // Commission only becomes claimable once the order is BOTH confirmed
      // paid and actually delivered — split OUTSTANDING accordingly so the
      // vendor sees an honest, fintech-style breakdown of what's real money
      // in hand vs. what's still pending on their end.
      if (item.payoutStatus === 'OUTSTANDING') {
        const eligible = item.order.status === 'Delivered' && item.order.paymentStatus === 'PAID';
        if (eligible) {
          payouts.READY_TO_SETTLE += item.commissionAmount;
        } else {
          payouts.PENDING_DELIVERY += item.commissionAmount;
        }
      }

      const key = item.listingId;
      if (!byListing[key]) {
        byListing[key] = { title: item.listing.title, unitsSold: 0, revenue: 0, netEarnings: 0 };
      }
      byListing[key].unitsSold += item.quantity;
      byListing[key].revenue += itemSales;
      byListing[key].netEarnings += item.vendorNetAmount;
    }

    const listingBreakdown = Object.values(byListing).sort((a, b) => b.revenue - a.revenue);

    return Response.json({
      totalSales,
      totalCommission,
      totalNet,
      payouts,
      listingBreakdown,
      totalOrders: validOrderIds.size,
    });
  } catch (error) {
    console.error('VENDOR FINANCE GET ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
