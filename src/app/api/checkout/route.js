import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { fullName, phone, state, city, address, instructions } = await req.json();

    if (!fullName || !phone || !state || !city || !address) {
      return Response.json({ error: 'Missing delivery details' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, name: true },
    });

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: { listing: true },
    });

    if (cartItems.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const config = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
    const commissionRate = config?.commissionRate ?? 3;

    // Group cart items by vendor — each vendor's items become their own order,
    // since the customer pays each vendor directly and separately.
    const itemsByVendor = new Map();
    for (const item of cartItems) {
      const vendorId = item.listing.vendorId;
      if (!itemsByVendor.has(vendorId)) itemsByVendor.set(vendorId, []);
      itemsByVendor.get(vendorId).push(item);
    }

    // Block checkout entirely if any vendor in the cart is currently on vacation.
    // Nothing has been created yet at this point, so this is a clean, safe stop.
    const vendorIds = [...itemsByVendor.keys()];
    const vendorRecords = await prisma.user.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, businessName: true, name: true, isOnVacation: true },
    });
    const vacationingVendors = vendorRecords.filter((v) => v.isOnVacation);
    if (vacationingVendors.length > 0) {
      const names = vacationingVendors.map((v) => v.businessName || v.name).join(', ');
      const verb = vacationingVendors.length > 1 ? 'are' : 'is';
      return Response.json(
        {
          error: `${names} ${verb} currently unavailable and not accepting new orders right now. Please remove their items from your cart to continue.`,
        },
        { status: 400 }
      );
    }

    const checkoutGroupId = crypto.randomUUID();
    const createdOrders = [];

    for (const [vendorId, vendorItems] of itemsByVendor.entries()) {
      const orderItemsData = vendorItems.map((item) => {
        const itemGross = item.listing.price * item.quantity;
        const commissionAmount = Math.round(itemGross * (commissionRate / 100));
        const vendorNetAmount = itemGross - commissionAmount;

        return {
          listingId: item.listingId,
          quantity: item.quantity,
          price: item.listing.price,
          commissionRate,
          commissionAmount,
          vendorNetAmount,
          payoutStatus: 'OUTSTANDING',
        };
      });

      const subtotal = orderItemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);
      // Delivery fee is not yet known — the vendor will set it after reviewing the order
      const deliveryFee = 0;
      const totalAmount = subtotal;

      const order = await prisma.order.create({
        data: {
          userId: session.userId,
          totalAmount,
          subtotal,
          deliveryFee,
          paymentStatus: 'UNPAID',
          status: 'Order Placed',
          fullName,
          phone,
          state,
          city,
          address,
          instructions: instructions || null,
          checkoutGroupId,
          items: {
            create: orderItemsData,
          },
        },
      });

      createdOrders.push(order);
    }

    await prisma.cartItem.deleteMany({ where: { userId: session.userId } });

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        savedPhone: phone,
        savedState: state,
        savedCity: city,
        savedAddress: address,
        savedInstructions: instructions || null,
      },
    });

    if (user?.email) {
      const vendorCount = itemsByVendor.size;
      const orderSummaryTotal = createdOrders.reduce((sum, o) => sum + o.subtotal, 0);
      await sendEmail({
        to: user.email,
        subject: 'Your Silverstar Order Confirmation',
        html: `
          <h2>Thanks for your order, ${user.name || fullName}!</h2>
          <p>We've received your order${vendorCount > 1 ? `, split across ${vendorCount} shops since it included items from more than one seller` : ''} and it's being processed.</p>
          <p><strong>Delivery Address:</strong> ${address}, ${city}, ${state}</p>
          <p><strong>Total:</strong> ₦${orderSummaryTotal.toLocaleString()}</p>
          <p>You can track your order status anytime from your dashboard.</p>
        `,
      });
    }

    return Response.json({
      success: true,
      checkoutGroupId,
      orderIds: createdOrders.map((o) => o.id),
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
