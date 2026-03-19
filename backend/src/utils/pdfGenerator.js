const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');

/**
 * Generates a modern certificate and uploads it to Cloudinary.
 * @param {string} studentName 
 * @param {string} eventTitle 
 * @param {Date} date 
 * @returns {Promise<string>} The secure URL of the uploaded certificate.
 */
const generateCertificate = async (studentName, eventTitle, date) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'code-circle/certificates',
        resource_type: 'auto',
        format: 'pdf',
        public_id: `certificate_${studentName.replace(/\s+/g, '_')}_${Date.now()}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#050505');

    // Decorative elements (Glassmorphism inspired)
    doc.circle(0, 0, 200).fillOpacity(0.1).fill('#3b82f6');
    doc.circle(doc.page.width, doc.page.height, 150).fillOpacity(0.1).fill('#8b5cf6');

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#ffffff');

    // Content
    doc.fillOpacity(1);
    doc.fillColor('#ffffff');

    doc.fontSize(50)
       .font('Helvetica-Bold')
       .text('CERTIFICATE', 0, 100, { align: 'center' });

    doc.fontSize(20)
       .font('Helvetica')
       .text('OF APPRECIATION', { align: 'center' })
       .moveDown(2);

    doc.fontSize(16)
       .text('PROUDLY PRESENTED TO', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(35)
       .font('Helvetica-Bold')
       .fillColor('#3b82f6')
       .text(studentName.toUpperCase(), { align: 'center' })
       .moveDown(1);

    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#ffffff')
       .text('For successfully participating in', { align: 'center' })
       .moveDown(0.5);

    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(eventTitle, { align: 'center' })
       .moveDown(1.5);

    const issueDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#94a3b8')
       .text(`Issued on ${issueDate}`, { align: 'center' });

    // Logo Placeholder or Text
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .text('CODE CIRCLE', 0, doc.page.height - 80, { align: 'center' });

    doc.pipe(uploadStream);
    doc.end();
  });
};

module.exports = { generateCertificate };
