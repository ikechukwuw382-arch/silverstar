import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PAGE_SIZE = 20;
const MAX_LISTING_PHOTOS = 6;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Lightweight, separate path for the homepage's Featured Products row —
    // always the newest active listings, ignores search/category/pagination
    if (searchParams.get("featured") === "1") {
      const featured = await prisma.listing.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          vendor: {
            select: {
              name: true,
              kyc: { select: { status: true } },
              isOnVacation: true,
            },
          },
        },
      });
      return Response.json({ featured });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "All";
    const sortBy = searchParams.get("sortBy") || "Newest";

    const where = { status: "active" };

    if (category !== "All") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy = { createdAt: "desc" };
    if (sortBy === "Price: Low to High") orderBy = { price: "asc" };
    if (sortBy === "Price: High to Low") orderBy = { price: "desc" };

    const [listings, totalCount, totalActiveListings, verifiedVendorRows] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          vendor: {
            select: {
              name: true,
              kyc: { select: { status: true } },
              isOnVacation: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.findMany({
        where: { status: "active", vendor: { kyc: { status: "approved" } } },
        distinct: ["vendorId"],
        select: { vendorId: true },
      }),
    ]);

    return Response.json({
      listings,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
      },
      stats: {
        totalActiveListings,
        verifiedVendorCount: verifiedVendorRows.length,
      },
    });
  } catch (error) {
    console.error("LISTINGS FETCH ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    if (session.role !== "vendor" && session.role !== "admin") {
      return Response.json({ error: "Only vendors can post listings." }, { status: 403 });
    }

    if (session.role === "vendor") {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== "approved") {
        return Response.json(
          { error: "Your identity verification must be approved before you can post listings." },
          { status: 403 }
        );
      }
    }

    const { title, description, category, price, imageUrl, images, condition } = await request.json();

    if (!title || !description || !category || !price) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }

    // Never trust image data from the client beyond basic shape/type/count checks.
    const cleanImages = Array.isArray(images)
      ? images.filter((url) => typeof url === "string" && url.trim().length > 0).slice(0, MAX_LISTING_PHOTOS)
      : [];

    // imageUrl must always be consistent with images[0] for backward compatibility
    // with every existing card/grid/thumbnail that still reads imageUrl directly.
    const resolvedImageUrl = cleanImages[0] || (typeof imageUrl === "string" ? imageUrl : null) || null;

    const listing = await prisma.listing.create({
      data: {
        vendorId: session.userId,
        title,
        description,
        category,
        price: parseInt(price, 10),
        imageUrl: resolvedImageUrl,
        images: cleanImages,
        condition: condition || "New",
      },
    });

    return Response.json({ success: true, listing });
  } catch (error) {
    console.error("CREATE LISTING ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await request.json();
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      return Response.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.vendorId !== session.userId && session.role !== "admin") {
      return Response.json({ error: "You can only delete your own listings." }, { status: 403 });
    }

    // Soft delete: mark as removed instead of destroying the row.
    // This keeps CartItem/OrderItem history and financial records intact.
    await prisma.listing.update({
      where: { id },
      data: { status: "removed" },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE LISTING ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
