require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Connected. Adding columns to Kyc table...');

  await client.query(`
    ALTER TABLE "Kyc"
    ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "idPhotoUrl" TEXT;
  `);

  console.log('✅ Columns added successfully (or already existed).');

  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
