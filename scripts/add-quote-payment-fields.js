require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Adding payment columns to ServiceQuote...");

  await client.query(`
    ALTER TABLE "ServiceQuote" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';
  `);
  await client.query(`
    ALTER TABLE "ServiceQuote" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;
  `);
  await client.query(`
    ALTER TABLE "ServiceQuote" ADD COLUMN IF NOT EXISTS "proofImagePath" TEXT;
  `);
  await client.query(`
    ALTER TABLE "ServiceQuote" ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3);
  `);
  await client.query(`
    ALTER TABLE "ServiceQuote" ADD COLUMN IF NOT EXISTS "paymentRejectedReason" TEXT;
  `);

  console.log("Columns added.");

  const check = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'ServiceQuote'
      AND column_name IN ('paymentStatus','paymentReference','proofImagePath','paymentSubmittedAt','paymentRejectedReason')
    ORDER BY column_name;
  `);
  console.log("Columns present:", check.rows);

  console.log("DONE.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
