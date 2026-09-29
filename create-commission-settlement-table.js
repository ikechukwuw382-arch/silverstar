// One-time script: creates the CommissionSettlement table in Postgres.
// Matches the CommissionSettlement model just added to prisma/schema.prisma.
//
// Run once from ~/projects/silverstar with:
//   node create-commission-settlement-table.js

require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Creating CommissionSettlement table (if it does not already exist)...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "CommissionSettlement" (
        "id"               TEXT PRIMARY KEY,
        "vendorId"         TEXT NOT NULL,
        "amountClaimed"    INTEGER NOT NULL,
        "bankReference"    TEXT NOT NULL,
        "receiptImagePath" TEXT,
        "vendorNote"       TEXT,
        "status"           TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
        "submittedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedAt"       TIMESTAMP(3),
        "adminNote"        TEXT,
        CONSTRAINT "CommissionSettlement_vendorId_fkey"
          FOREIGN KEY ("vendorId") REFERENCES "User"("id")
      );
    `);
    console.log('Table created (or already existed).');

    console.log('Creating indexes (if they do not already exist)...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CommissionSettlement_vendorId_idx"
        ON "CommissionSettlement" ("vendorId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "CommissionSettlement_status_idx"
        ON "CommissionSettlement" ("status");
    `);
    console.log('Indexes created (or already existed).');

    console.log('\nVerifying table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'CommissionSettlement'
      ORDER BY ordinal_position;
    `);
    console.table(columns.rows);

    console.log('\nDone.');
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await client.end();
  }
}

main();
