require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT id, subtotal, "totalAmount", "createdAt" FROM "Order" ORDER BY "createdAt" DESC LIMIT 1`);
  console.log(res.rows);
  const orderId = res.rows[0].id;
  const items = await client.query(`SELECT * FROM "OrderItem" WHERE "orderId" = $1`, [orderId]);
  console.log(items.rows);
  await client.end();
}
main();
