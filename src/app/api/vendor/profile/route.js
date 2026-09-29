import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        shopBio: true,
        businessName: true,
        profilePicUrl: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        whatsappNumber: true,
        isOnVacation: true,
        vacationMessage: true,
        returnsPolicy: true,
      },
    });

    return Response.json({
      shopBio: user?.shopBio || "",
      businessName: user?.businessName || "",
      profilePicUrl: user?.profilePicUrl || "",
      bankName: user?.bankName || "",
      accountNumber: user?.accountNumber || "",
      accountHolderName: user?.accountHolderName || "",
      whatsappNumber: user?.whatsappNumber || "",
      isOnVacation: user?.isOnVacation || false,
      vacationMessage: user?.vacationMessage || "",
      returnsPolicy: user?.returnsPolicy || "",
    });
  } catch (error) {
    console.error("FETCH SHOP BIO ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    if (session.role !== "vendor" && session.role !== "admin") {
      return Response.json({ error: "Only vendors can edit a shop bio." }, { status: 403 });
    }

    if (session.role === "vendor") {
      const kyc = await prisma.kyc.findUnique({
        where: { userId: session.userId },
        select: { status: true },
      });

      if (!kyc || kyc.status !== "approved") {
        return Response.json(
          { error: "Your identity verification must be approved before you can edit your shop." },
          { status: 403 }
        );
      }
    }

    const {
      shopBio,
      businessName,
      profilePicUrl,
      bankName,
      accountNumber,
      accountHolderName,
      whatsappNumber,
      isOnVacation,
      vacationMessage,
      returnsPolicy,
    } = await request.json();

    if (shopBio && shopBio.length > 300) {
      return Response.json({ error: "Bio must be 300 characters or less." }, { status: 400 });
    }

    const bankFieldsProvided = [bankName, accountNumber, accountHolderName].some(
      (v) => v && String(v).trim().length > 0
    );

    if (bankFieldsProvided) {
      if (!bankName || !accountNumber || !accountHolderName) {
        return Response.json(
          { error: "Please fill in bank name, account number, and account holder name together." },
          { status: 400 }
        );
      }

      const cleanedAccountNumber = String(accountNumber).trim();
      if (!/^\d{10}$/.test(cleanedAccountNumber)) {
        return Response.json(
          { error: "Account number must be exactly 10 digits." },
          { status: 400 }
        );
      }

      if (accountHolderName.trim().length < 2) {
        return Response.json(
          { error: "Please enter the full account holder name." },
          { status: 400 }
        );
      }
    }

    let cleanedWhatsapp = null;
    if (whatsappNumber && String(whatsappNumber).trim().length > 0) {
      cleanedWhatsapp = String(whatsappNumber).trim();
      const digitsOnly = cleanedWhatsapp.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        return Response.json(
          { error: "Please enter a valid WhatsApp number." },
          { status: 400 }
        );
      }
    }

    if (vacationMessage && vacationMessage.length > 200) {
      return Response.json(
        { error: "Vacation message must be 200 characters or less." },
        { status: 400 }
      );
    }

    if (returnsPolicy && returnsPolicy.length > 1000) {
      return Response.json(
        { error: "Returns policy must be 1000 characters or less." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        shopBio: shopBio || null,
        businessName: businessName || null,
        profilePicUrl: profilePicUrl || null,
        bankName: bankFieldsProvided ? bankName.trim() : null,
        accountNumber: bankFieldsProvided ? String(accountNumber).trim() : null,
        accountHolderName: bankFieldsProvided ? accountHolderName.trim() : null,
        whatsappNumber: cleanedWhatsapp,
        isOnVacation: Boolean(isOnVacation),
        vacationMessage: vacationMessage ? vacationMessage.trim() : null,
        returnsPolicy: returnsPolicy ? returnsPolicy.trim() : null,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("UPDATE SHOP BIO ERROR:", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
