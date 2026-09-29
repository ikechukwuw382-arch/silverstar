require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const statements = [
    `CREATE INDEX IF NOT EXISTS "Listing_status_category_idx" ON "Listing" ("status", "category");`,
    `CREATE INDEX IF NOT EXISTS "Listing_status_createdAt_idx" ON "Listing" ("status", "createdAt");`,
    `CREATE INDEX IF NOT EXISTS "Listing_status_price_idx" ON "Listing" ("status", "price");`,
    `CREATE INDEX IF NOT EXISTS "Listing_vendorId_idx" ON "Listing" ("vendorId");`,
  ];

  for (const sql of statements) {
    console.log("Running:", sql);
    await client.query(sql);
  }

  console.log("Done. Indexes created (or already existed).");
  await client.end();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
