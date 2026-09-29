require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
const sql = fs.readFileSync('./fix_commission.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Tables created successfully');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
