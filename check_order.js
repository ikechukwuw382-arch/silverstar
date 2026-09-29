require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT * FROM "OrderItem" WHERE "orderId" = 'cmtcme8ew0003i9s6kdkpxsqs'`);
  console.log(res.rows);
  await client.end();
}
main();
