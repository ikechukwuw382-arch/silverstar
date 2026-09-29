import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            name: true,
            kyc: { select: { status: true } },
            isOnVacation: true,
            vacationMessage: true,
          },
        },
      },
    });

    if (!listing || listing.status !== "active") {
      return Response.json({ error: "Listing not found." }, { status: 404 });
    }

    return Response.json({ listing });
  } catch (error) {
    console.error("SINGLE LISTING FETCH ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
