import 'dotenv/config';
import { sendEmail } from './src/lib/email.js';

async function main() {
  const result = await sendEmail({
to: 'silverstarglobal8@gmail.com',
    subject: 'Silverstar Test Email',
    html: '<h1>It works!</h1><p>This is a test from Silverstar.</p>',
  });

  console.log(result);
}

main();
