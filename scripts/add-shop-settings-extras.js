require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Adding new columns to User...");
  await client.query(`
    ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT,
      ADD COLUMN IF NOT EXISTS "isOnVacation" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "vacationMessage" TEXT,
      ADD COLUMN IF NOT EXISTS "returnsPolicy" TEXT;
  `);
  console.log("User columns added.");

  console.log("Creating VendorDeliveryZone table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS "VendorDeliveryZone" (
      "id" TEXT PRIMARY KEY,
      "vendorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "areaName" TEXT NOT NULL,
      "fee" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS "VendorDeliveryZone_vendorId_idx"
      ON "VendorDeliveryZone"("vendorId");
  `);
  console.log("VendorDeliveryZone table created.");

  // Verify
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'User' AND column_name IN
      ('whatsappNumber','isOnVacation','vacationMessage','returnsPolicy');
  `);
  console.log("User columns present:", cols.rows.map((r) => r.column_name));

  const table = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'VendorDeliveryZone';
  `);
  console.log("VendorDeliveryZone columns:", table.rows.map((r) => r.column_name));

  await client.end();
  console.log("DONE.");
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  process.exit(1);
});
