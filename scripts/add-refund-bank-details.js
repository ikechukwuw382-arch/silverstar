require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    ALTER TABLE "RefundRequest"
    ADD COLUMN IF NOT EXISTS "refundBankName" TEXT,
    ADD COLUMN IF NOT EXISTS "refundAccountName" TEXT,
    ADD COLUMN IF NOT EXISTS "refundAccountNo" TEXT;
  `);

  console.log('Done: refund bank detail columns added.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
