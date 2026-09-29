require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "businessName" TEXT,
    ADD COLUMN IF NOT EXISTS "profilePicUrl" TEXT;
  `);
  console.log("Columns added successfully");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
