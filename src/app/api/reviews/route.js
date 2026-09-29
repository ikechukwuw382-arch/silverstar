import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { orderItemId, rating, comment } = await request.json();

    if (!orderItemId || !rating) {
      return Response.json({ error: "Rating is required." }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return Response.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true },
    });

    if (!orderItem) {
      return Response.json({ error: "Order item not found." }, { status: 404 });
    }

    if (orderItem.order.userId !== session.userId) {
      return Response.json({ error: "You can only review items you purchased." }, { status: 403 });
    }

    if (orderItem.order.status !== "Delivered") {
      return Response.json({ error: "You can only review items after delivery." }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({
      where: { orderItemId },
    });

    if (existing) {
      return Response.json({ error: "You already reviewed this item." }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        userId: session.userId,
        listingId: orderItem.listingId,
        orderItemId,
      },
    });

    return Response.json({ success: true, review });
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
