import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = token ? await verifySession(token) : null;
  if (!session || session.role !== 'admin') return null;
  return session;
}

// GET — returns every settlement currently pending review, oldest first,
// with the vendor's name attached so the admin queue doesn't need a
// second lookup per row.
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const pending = await prisma.commissionSettlement.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { submittedAt: 'asc' },
      include: {
        vendor: { select: { name: true, businessName: true, email: true } },
      },
    });

    return Response.json({ pending });
  } catch (error) {
    console.error('ADMIN SETTLEMENTS GET ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

// PATCH — confirm or reject a specific settlement.
// Confirm: settlement -> CONFIRMED, and every OrderItem this vendor had
//   sitting in SUBMITTED flips to SETTLED.
// Reject: settlement -> REJECTED (with the admin's reason attached), and
//   every OrderItem this vendor had sitting in SUBMITTED reverts to
//   OUTSTANDING so they remain owed and the vendor can resubmit.
export async function PATCH(request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const { settlementId, action, adminNote } = await request.json();

    if (!settlementId || !['confirm', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const settlement = await prisma.commissionSettlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      return Response.json({ error: 'Settlement not found.' }, { status: 404 });
    }

    if (settlement.status !== 'PENDING_REVIEW') {
      return Response.json({ error: 'This settlement has already been reviewed.' }, { status: 400 });
    }

    if (action === 'reject' && (!adminNote || !adminNote.trim())) {
      return Response.json({ error: 'A reason is required to reject a settlement.' }, { status: 400 });
    }

    const newSettlementStatus = action === 'confirm' ? 'CONFIRMED' : 'REJECTED';
    const newItemStatus = action === 'confirm' ? 'SETTLED' : 'OUTSTANDING';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSettlement = await tx.commissionSettlement.update({
        where: { id: settlementId },
        data: {
          status: newSettlementStatus,
          reviewedAt: new Date(),
          adminNote: adminNote?.trim() || null,
        },
      });

      await tx.orderItem.updateMany({
        where: {
          payoutStatus: 'SUBMITTED',
          listing: { vendorId: settlement.vendorId },
        },
        data: { payoutStatus: newItemStatus },
      });

      return updatedSettlement;
    });

    return Response.json({ success: true, settlement: updated });
  } catch (error) {
    console.error('ADMIN SETTLEMENTS PATCH ERROR:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
