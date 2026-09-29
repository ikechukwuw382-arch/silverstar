require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "refundStatus" TEXT NOT NULL DEFAULT 'NONE';
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "RefundRequest" (
      "id" TEXT PRIMARY KEY,
      "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id"),
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'REQUESTED',
      "bankReference" TEXT,
      "receiptImagePath" TEXT,
      "vendorNote" TEXT,
      "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "submittedAt" TIMESTAMP,
      "confirmedAt" TIMESTAMP
    );
  `);

  console.log('Done: refundStatus column + RefundRequest table added.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
