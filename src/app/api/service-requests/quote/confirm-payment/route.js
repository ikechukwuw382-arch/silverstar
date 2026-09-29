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

    if (session.role !== 'vendor' && session.role !== 'admin') {
      return Response.json({ error: 'Only vendors can confirm or reject payment.' }, { status: 403 });
    }

    if (session.role === 'vendor') {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== 'approved') {
        return Response.json(
          { error: 'Your identity verification must be approved before you can confirm payments.' },
          { status: 403 }
        );
      }
    }

    const { quoteId, action, reason } = await req.json();

    if (!quoteId || !['confirm', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (action === 'reject' && (!reason || !reason.trim())) {
      return Response.json({ error: 'Please explain why this payment is being rejected.' }, { status: 400 });
    }

    const quote = await prisma.serviceQuote.findUnique({
      where: { id: quoteId },
      include: { request: true },
    });

    if (!quote) {
      return Response.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Only the engineer actually assigned to this job (or an admin) may confirm its payment
    if (session.role === 'vendor' && quote.request.engineerId !== session.userId) {
      return Response.json({ error: 'Not authorized for this repair job' }, { status: 403 });
    }

    if (quote.paymentStatus !== 'PAYMENT_SUBMITTED') {
      return Response.json(
        { error: 'This repair job has no pending payment to review.' },
        { status: 400 }
      );
    }

    const updatedQuote = await prisma.serviceQuote.update({
      where: { id: quoteId },
      data:
        action === 'confirm'
          ? { paymentStatus: 'PAID', paymentRejectedReason: null }
          : { paymentStatus: 'PAYMENT_REJECTED', paymentRejectedReason: reason.trim() },
    });

    // Only once payment is actually confirmed does the job move into real repair work
    if (action === 'confirm') {
      await prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'Repairing' },
      });
    }

    return Response.json({ success: true, quote: updatedQuote });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
