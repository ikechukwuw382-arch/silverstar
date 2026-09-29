require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "savedPhone" TEXT,
    ADD COLUMN IF NOT EXISTS "savedState" TEXT,
    ADD COLUMN IF NOT EXISTS "savedCity" TEXT,
    ADD COLUMN IF NOT EXISTS "savedAddress" TEXT,
    ADD COLUMN IF NOT EXISTS "savedInstructions" TEXT;
  `);

  console.log("Saved address columns added successfully.");
  await client.end();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
