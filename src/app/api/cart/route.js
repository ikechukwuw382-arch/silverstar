import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  return token ? await verifySession(token) : null;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: {
        listing: {
          include: {
            vendor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ items });
  } catch (error) {
    console.error("CART FETCH ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    const { listingId } = await request.json();
    if (!listingId) {
      return Response.json({ error: "Listing ID is required." }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!listing || listing.status !== "active") {
      return Response.json({ error: "This listing is not available." }, { status: 404 });
    }

    if (listing.vendorId === session.userId) {
      return Response.json({ error: "You cannot add your own listing to your cart." }, { status: 403 });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_listingId: { userId: session.userId, listingId } },
    });

    let item;
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { userId: session.userId, listingId, quantity: 1 },
      });
    }

    return Response.json({ success: true, item });
  } catch (error) {
    console.error("CART ADD ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    const { id, quantity } = await request.json();

    if (!id || typeof quantity !== "number" || quantity < 1 || quantity > 20) {
      return Response.json({ error: "Invalid quantity." }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) {
      return Response.json({ error: "Cart item not found." }, { status: 404 });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    return Response.json({ success: true, item: updated });
  } catch (error) {
    console.error("CART UPDATE ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== session.userId) {
      return Response.json({ error: "Cart item not found." }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("CART DELETE ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
