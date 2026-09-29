import { PrismaClient } from "./src/generated/prisma/client.js";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Connected! Users:", users);
}

main()
  .catch((e) => console.error("DB ERROR:", e))
  .finally(() => prisma.$disconnect());
