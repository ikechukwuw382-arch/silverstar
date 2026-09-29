require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "bankName" TEXT,
    ADD COLUMN IF NOT EXISTS "accountNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "accountHolderName" TEXT;
  `);
  console.log("Bank fields added successfully.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
