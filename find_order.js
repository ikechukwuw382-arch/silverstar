require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT id, "totalAmount" FROM "Order" WHERE id LIKE '%KDKPXSQS'`);
  console.log(res.rows);
  await client.end();
}
main();
