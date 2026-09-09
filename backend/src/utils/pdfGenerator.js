const PDFDocument = require('pdfkit');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

/**
 * Generates a modern certificate and uploads it to Cloudinary.
 * If templateUrl is provided, it uses the admin-uploaded template as the background canvas.
 * @param {string} studentName 
 * @param {string} eventTitle 
 * @param {Date} date 
 * @param {string} [templateUrl]
 * @returns {Promise<string>} The secure URL of the uploaded certificate.
 */
const generateCertificate = async (studentName, eventTitle, date, templateUrl = null) => {
  return new Promise(async (resolve, reject) => {
    try {
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

      doc.pipe(uploadStream);

      // Check if custom admin certificate template exists
      let hasCustomTemplate = false;
      if (templateUrl && typeof templateUrl === 'string' && templateUrl.startsWith('http')) {
        try {
          const resp = await axios.get(templateUrl, { 
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'Accept': 'image/*,application/pdf' }
          });
          const templateBuffer = Buffer.from(resp.data);
          doc.image(templateBuffer, 0, 0, { width: doc.page.width, height: doc.page.height });
          hasCustomTemplate = true;
        } catch (imgErr) {
          console.warn('Could not load custom certificate template from URL, falling back to default:', imgErr.message);
        }
      }

      if (!hasCustomTemplate) {
        // Fallback default background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#050505');

        // Decorative elements
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

        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#ffffff')
           .text('CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY', 0, doc.page.height - 80, { align: 'center' });
      } else {
        // Overlay onto custom admin template with modern typography
        doc.fillOpacity(1);

        // Student Name centered in the designated certificate body area
        doc.fillColor('#0f172a');
        doc.fontSize(36)
           .font('Helvetica-Bold')
           .text(studentName.toUpperCase(), 40, doc.page.height * 0.48, { align: 'center', width: doc.page.width - 80 });

        // Event participation text
        doc.fontSize(15)
           .font('Helvetica')
           .fillColor('#334155')
           .text(`for active participation in ${eventTitle}`, 40, doc.page.height * 0.58, { align: 'center', width: doc.page.width - 80 });

        const issueDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#64748b')
           .text(`Bannari Amman Institute of Technology (BIT) · ${issueDate}`, 40, doc.page.height * 0.82, { align: 'center', width: doc.page.width - 80 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificate };
