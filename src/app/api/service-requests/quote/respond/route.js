import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function PATCH(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { quoteId, response } = await req.json();

    if (!["Accepted", "Declined"].includes(response)) {
      return Response.json({ error: 'Invalid response' }, { status: 400 });
    }

    const quote = await prisma.serviceQuote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });

    if (!quote || quote.request.customerId !== session.userId) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updatedQuote = await prisma.serviceQuote.update({
      where: { id: quoteId },
      data: { status: response },
    });

    // If accepted, move the request back into active repair status
    if (response === "Accepted") {
      await prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: "Repairing" },
      });
    }

    return Response.json({ success: true, quote: updatedQuote });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
