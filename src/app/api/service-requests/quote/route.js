import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { requestId, diagnosis, partsCost, labourCost } = await req.json();

    if (!requestId || !diagnosis || partsCost == null || labourCost == null) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request || request.engineerId !== session.userId) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const totalCost = Number(partsCost) + Number(labourCost);

    const quote = await prisma.serviceQuote.create({
      data: {
        requestId,
        diagnosis,
        partsCost: Number(partsCost),
        labourCost: Number(labourCost),
        totalCost,
      },
    });

    return Response.json({ success: true, quote });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
