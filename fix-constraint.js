import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  await client.query(`
    ALTER TABLE "PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_key" UNIQUE ("userId");
  `);
  console.log("Constraint added successfully.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  client.end();
});
