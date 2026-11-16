const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await mongoose.connection.collection('issuedcertificates').updateMany(
      { status: { $ne: 'REVOKED' } },
      {
        $set: {
          status: 'REVOKED',
          revocationReason: 'Bulk revoked by institutional administration',
          revokedAt: new Date()
        }
      }
    );
    console.log('Revocation update result:', result);
    const allCerts = await mongoose.connection.collection('issuedcertificates').find({}).toArray();
    console.log('Total certificates:', allCerts.length);
    console.log('Active count:', allCerts.filter(c => c.status === 'ACTIVE').length);
    console.log('Revoked count:', allCerts.filter(c => c.status === 'REVOKED').length);
    process.exit(0);
  } catch (err) {
    console.error('Error revoking certificates:', err);
    process.exit(1);
  }
})();
