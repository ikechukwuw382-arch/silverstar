import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getVendorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return null;
  return session;
}

// GET — returns the vendor's most recent settlement submission, so the
// vendor-finance page knows whether to show "Submit Settlement" or a
// status badge (Under Review / Rejected / Settled).
export async function GET() {
  const session = await getVendorSession();
  if (!session) {
    return Response.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  try {
    const latest = await prisma.commissionSettlement.findFirst({
      where: { vendorId: session.userId },
      orderBy: { submittedAt: 'desc' },
    });

    return Response.json({ latest });
  } catch (error) {
    console.error('VENDOR SETTLEMENT GET ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

// POST — vendor submits proof of a commission settlement payment.
// The amount is always recalculated server-side from real OrderItem data —
// never trusted from the request body — so a vendor cannot claim a
// different amount than what they actually owe.
export async function POST(request) {
  const session = await getVendorSession();
  if (!session) {
    return Response.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  if (session.role !== 'vendor' && session.role !== 'admin') {
    return Response.json({ error: 'Only vendors can submit a settlement.' }, { status: 403 });
  }

  if (session.role === 'vendor') {
    const kyc = await prisma.kyc.findUnique({
      where: { userId: session.userId },
      select: { status: true },
    });

    if (!kyc || kyc.status !== 'approved') {
      return Response.json(
        { error: 'Your identity verification must be approved before you can submit a settlement.' },
        { status: 403 }
      );
    }
  }

  try {
    const { bankReference, receiptImagePath, vendorNote } = await request.json();

    if (!bankReference || !bankReference.trim()) {
      return Response.json({ error: 'A bank reference is required.' }, { status: 400 });
    }

    // Block a duplicate submission while one is already under review.
    const existingPending = await prisma.commissionSettlement.findFirst({
      where: { vendorId: session.userId, status: 'PENDING_REVIEW' },
    });
    if (existingPending) {
      return Response.json(
        { error: 'You already have a settlement under review. Please wait for it to be reviewed before submitting another.' },
        { status: 400 }
      );
    }

    // Recalculate the true settleable balance directly from the database.
    // Only items whose order is BOTH confirmed paid AND actually delivered
    // are eligible — this is the real anti-fraud gate: a vendor can never
    // claim commission on a sale that hasn't been paid for, or hasn't
    // shipped yet, no matter what the client sends.
    const outstandingItems = await prisma.orderItem.findMany({
      where: {
        payoutStatus: 'OUTSTANDING',
        listing: { vendorId: session.userId },
        order: { status: 'Delivered', paymentStatus: 'PAID' },
      },
select: { id: true, commissionAmount: true },
    });

const amountClaimed = outstandingItems.reduce((sum, item) => sum + item.commissionAmount, 0);

    if (amountClaimed <= 0) {
      return Response.json(
        { error: 'You have no commission ready to settle yet. Commission becomes claimable once an order is paid and delivered.' },
        { status: 400 }
      );
    }

    const itemIds = outstandingItems.map((item) => item.id);

    // Create the settlement record and flip the covered items to SUBMITTED
    // together, so the numbers can never drift out of sync.
    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.commissionSettlement.create({
        data: {
          vendorId: session.userId,
          amountClaimed,
          bankReference: bankReference.trim(),
          receiptImagePath: receiptImagePath || null,
          vendorNote: vendorNote?.trim() || null,
          status: 'PENDING_REVIEW',
        },
      });

      await tx.orderItem.updateMany({
        where: { id: { in: itemIds } },
        data: { payoutStatus: 'SUBMITTED' },
      });

      return created;
    });

    return Response.json({ success: true, settlement });
  } catch (error) {
    console.error('VENDOR SETTLEMENT POST ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
