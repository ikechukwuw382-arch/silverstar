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

    const { quoteId, paymentReference, proofImagePath } = await req.json();

    if (!paymentReference || !paymentReference.trim()) {
      return Response.json({ error: 'Please enter your payment reference or transaction ID.' }, { status: 400 });
    }

    const quote = await prisma.serviceQuote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });

    if (!quote || quote.request.customerId !== session.userId) {
      return Response.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.status !== 'Accepted') {
      return Response.json({ error: 'You need to accept this quote before paying.' }, { status: 400 });
    }

    if (quote.paymentStatus !== 'UNPAID' && quote.paymentStatus !== 'PAYMENT_REJECTED') {
      return Response.json({ error: 'Payment has already been submitted for this quote.' }, { status: 400 });
    }

    const engineerId = quote.request.engineerId;
    const cleanedReference = paymentReference.trim();

    // Fraud check: block reusing the same payment reference against the same engineer
    if (engineerId) {
      const duplicate = await prisma.serviceQuote.findFirst({
        where: {
          id: { not: quote.id },
          paymentReference: cleanedReference,
          paymentStatus: { in: ['PAYMENT_SUBMITTED', 'PAID'] },
          request: { engineerId },
        },
      });

      if (duplicate) {
        return Response.json(
          { error: 'This payment reference has already been used on another repair job.' },
          { status: 400 }
        );
      }
    }

    await prisma.serviceQuote.update({
      where: { id: quote.id },
      data: {
        paymentReference: cleanedReference,
        proofImagePath: proofImagePath || null,
        paymentStatus: 'PAYMENT_SUBMITTED',
        paymentSubmittedAt: new Date(),
        paymentRejectedReason: null,
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
