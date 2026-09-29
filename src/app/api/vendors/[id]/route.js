import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const vendor = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        shopBio: true,
        businessName: true,
        profilePicUrl: true,
        createdAt: true,
        kyc: { select: { status: true } },
        whatsappNumber: true,
        isOnVacation: true,
        vacationMessage: true,
        returnsPolicy: true,
      },
    });

    if (!vendor) {
      return Response.json({ error: "Vendor not found." }, { status: 404 });
    }

    const listings = await prisma.listing.findMany({
      where: { vendorId: id, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    const listingIds = listings.map((l) => l.id);

    const reviews = await prisma.review.findMany({
      where: { listingId: { in: listingIds } },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const deliveryZones = await prisma.vendorDeliveryZone.findMany({
      where: { vendorId: id },
      orderBy: { areaName: "asc" },
    });

    return Response.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        shopBio: vendor.shopBio,
        businessName: vendor.businessName,
        profilePicUrl: vendor.profilePicUrl,
        joinedAt: vendor.createdAt,
        verified: vendor.kyc?.status === "approved",
        whatsappNumber: vendor.whatsappNumber,
        isOnVacation: vendor.isOnVacation,
        vacationMessage: vendor.vacationMessage,
        returnsPolicy: vendor.returnsPolicy,
      },
      listings,
      deliveryZones,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      totalListings: listings.length,
    });
  } catch (error) {
    console.error("FETCH VENDOR STOREFRONT ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
