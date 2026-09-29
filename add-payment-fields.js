require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "checkoutGroupId" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
    ADD COLUMN IF NOT EXISTS "proofImagePath" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "paymentRejectedReason" TEXT;
  `);
  console.log("Payment fields added successfully.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
