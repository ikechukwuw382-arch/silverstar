require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Adding images column to Listing...");
  await client.query(`
    ALTER TABLE "Listing"
      ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT '{}';
  `);
  console.log("Column added.");

  // Backfill: any existing listing with an imageUrl but an empty images
  // array gets that one photo copied in, so old listings still show
  // correctly in the new gallery instead of appearing to have zero photos.
  console.log("Backfilling images from existing imageUrl...");
  const result = await client.query(`
    UPDATE "Listing"
    SET "images" = ARRAY["imageUrl"]
    WHERE "imageUrl" IS NOT NULL
      AND array_length("images", 1) IS NULL;
  `);
  console.log(`Backfilled ${result.rowCount} listing(s).`);

  const check = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'Listing' AND column_name = 'images';
  `);
  console.log("Column present:", check.rows);

  await client.end();
  console.log("DONE.");
}

main().catch((e) => {
  console.error("SCRIPT FAILED:", e);
  process.exit(1);
});
