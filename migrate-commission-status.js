// One-time migration: convert OrderItem.payoutStatus values from the old
// escrow-model stages to the new commission-settlement stages.
//
// Old (Silverstar pays vendor out)      New (vendor owes Silverstar commission)
// NOT_ELIGIBLE, AVAILABLE_FOR_PAYOUT -> OUTSTANDING
// PENDING, PROCESSING                -> SUBMITTED
// PAID                               -> SETTLED
//
// Run once from ~/projects/silverstar with: node migrate-commission-status.js

require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Checking current payoutStatus values before migrating...');
    const before = await client.query(
      `SELECT "payoutStatus", COUNT(*) FROM "OrderItem" GROUP BY "payoutStatus"`
    );
    console.table(before.rows);

    const updates = [
      { from: ['NOT_ELIGIBLE', 'AVAILABLE_FOR_PAYOUT'], to: 'OUTSTANDING' },
      { from: ['PENDING', 'PROCESSING'], to: 'SUBMITTED' },
      { from: ['PAID'], to: 'SETTLED' },
    ];

    for (const { from, to } of updates) {
      const placeholders = from.map((_, i) => `$${i + 2}`).join(', ');
      const result = await client.query(
        `UPDATE "OrderItem" SET "payoutStatus" = $1 WHERE "payoutStatus" IN (${placeholders})`,
        [to, ...from]
      );
      console.log(`${from.join(', ')} -> ${to}: ${result.rowCount} row(s) updated.`);
    }

    console.log('\nFinal payoutStatus values after migration:');
    const after = await client.query(
      `SELECT "payoutStatus", COUNT(*) FROM "OrderItem" GROUP BY "payoutStatus"`
    );
    console.table(after.rows);

    console.log('\nDone.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
