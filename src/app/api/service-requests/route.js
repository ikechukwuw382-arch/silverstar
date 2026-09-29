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

    const {
      printerBrand,
      printerModel,
      serviceType,
      problemDescription,
      phone,
      state,
      city,
      address,
      additionalInfo,
      imageUrl,
    } = await req.json();

    if (!printerBrand || !printerModel || !serviceType || !problemDescription || !phone || !state || !city || !address) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a sequential request number like SR-1001
    const count = await prisma.serviceRequest.count();
    const requestNumber = `SR-${1001 + count}`;

    const request = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        customerId: session.userId,
        printerBrand,
        printerModel,
        serviceType,
        problemDescription,
        phone,
        state,
        city,
        address,
        additionalInfo: additionalInfo || null,
        imageUrl: imageUrl || null,
      },
    });

    return Response.json({ success: true, requestId: request.id, requestNumber });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: 'Not logged in' }, { status: 401 });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: session.userId },
      include: {
        quote: true,
        engineer: {
          select: {
            name: true,
            bankName: true,
            accountNumber: true,
            accountHolderName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ requests });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
