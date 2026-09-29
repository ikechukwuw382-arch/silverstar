import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { createSession } from "@/lib/session";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MINIMUM_AGE = 18;

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      return Response.json({ error: "You must be logged in." }, { status: 401 });
    }

    const {
      fullName,
      phoneNumber,
      address,
      idType,
      idNumber,
      dateOfBirth,
      idPhotoUrl,
    } = await request.json();

    if (
      !fullName ||
      !phoneNumber ||
      !address ||
      !idType ||
      !idNumber ||
      !dateOfBirth ||
      !idPhotoUrl
    ) {
      return Response.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const parsedDateOfBirth = new Date(dateOfBirth);
    if (isNaN(parsedDateOfBirth.getTime())) {
      return Response.json(
        { error: "Please provide a valid date of birth." },
        { status: 400 }
      );
    }

    const age = calculateAge(parsedDateOfBirth);
    if (age < MINIMUM_AGE) {
      return Response.json(
        { error: "You must be at least 18 years old to register as a vendor." },
        { status: 403 }
      );
    }

    const kyc = await prisma.kyc.upsert({
      where: { userId: session.userId },
      update: {
        fullName,
        phoneNumber,
        address,
        idType,
        idNumber,
        dateOfBirth: parsedDateOfBirth,
        idPhotoUrl,
        status: "pending",
      },
      create: {
        userId: session.userId,
        fullName,
        phoneNumber,
        address,
        idType,
        idNumber,
        dateOfBirth: parsedDateOfBirth,
        idPhotoUrl,
      },
    });

    let newToken = null;
    if (session.role === "customer") {
      await prisma.user.update({
        where: { id: session.userId },
        data: { role: "vendor" },
      });
      newToken = await createSession({ userId: session.userId, role: "vendor" });
    }

    const response = Response.json({ success: true, kyc });

    if (newToken) {
      response.headers.set(
        "Set-Cookie",
        `session=${newToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
      );
    }

    return response;
  } catch (error) {
    console.error("KYC ERROR:", error);
    return Response.json(
      { error: "Something went wrong.", details: error.message },
      { status: 500 }
    );
  }
}
