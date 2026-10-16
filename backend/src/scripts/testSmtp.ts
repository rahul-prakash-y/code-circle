import dotenv from 'dotenv';
dotenv.config();

import emailService from '../services/emailService';

async function main() {
  console.log('Testing SMTP connection...');
  console.log('Status:', emailService.getStatus());
  const res = await emailService.verifyConnection();
  console.log('Verification result:', res);
}

main().catch(console.error);
