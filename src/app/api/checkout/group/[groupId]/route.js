import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(req, { params }) {
  try {
    const { groupId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { checkoutGroupId: groupId, userId: session.userId },
      include: {
        items: {
          include: {
            listing: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    businessName: true,
                    bankName: true,
                    accountNumber: true,
                    accountHolderName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const result = orders.map((order) => {
      const vendor = order.items[0]?.listing?.vendor;
      return {
        orderId: order.id,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        paymentRejectedReason: order.paymentRejectedReason,
        proofImagePath: order.proofImagePath,
        vendor: vendor
          ? {
              name: vendor.businessName || vendor.name,
              bankName: vendor.bankName,
              accountNumber: vendor.accountNumber,
              accountHolderName: vendor.accountHolderName,
            }
          : null,
        itemCount: order.items.length,
        items: order.items.map((i) => ({
          title: i.listing.title,
          quantity: i.quantity,
          price: i.price,
        })),
      };
    });

    return Response.json({ orders: result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
