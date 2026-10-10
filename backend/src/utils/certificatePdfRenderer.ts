// @ts-ignore
import PDFDocument from 'pdfkit';
import axios from 'axios';
// @ts-ignore
import cloudinary from '../config/cloudinary';

export interface CertificateRenderOptions {
  recipientName: string;
  recipientRollNo?: string;
  title: string;
  subtitle?: string;
  description?: string;
  issuerOrganization?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  certificateId: string;
  verificationCode: string;
  issueDate?: Date | string;
  theme?: 'modern-blue' | 'executive-gold' | 'cyber-dark' | 'emerald-minimal' | 'ruby-elegance';
  orientation?: 'landscape' | 'portrait';
  bgImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

const THEME_PALETTES = {
  'modern-blue': {
    bg: '#0B1120',
    card: '#0F172A',
    border: '#1E293B',
    primary: '#38BDF8',
    secondary: '#818CF8',
    textMain: '#F8FAFC',
    textMuted: '#94A3B8',
    seal: '#0284C7',
  },
  'executive-gold': {
    bg: '#18181B',
    card: '#27272A',
    border: '#D97706',
    primary: '#FBBF24',
    secondary: '#D97706',
    textMain: '#FFFBEB',
    textMuted: '#D1D5DB',
    seal: '#B45309',
  },
  'cyber-dark': {
    bg: '#050505',
    card: '#0A0A0A',
    border: '#10B981',
    primary: '#34D399',
    secondary: '#065F46',
    textMain: '#FFFFFF',
    textMuted: '#A7F3D0',
    seal: '#059669',
  },
  'emerald-minimal': {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#059669',
    primary: '#047857',
    secondary: '#0D9488',
    textMain: '#0F172A',
    textMuted: '#475569',
    seal: '#059669',
  },
  'ruby-elegance': {
    bg: '#1C1917',
    card: '#292524',
    border: '#E11D48',
    primary: '#FB7185',
    secondary: '#BE123C',
    textMain: '#FFF1F2',
    textMuted: '#E2E8F0',
    seal: '#9F1239',
  },
};

/**
 * Builds an in-memory PDF Buffer using PDFKit with enterprise typography and vector layout.
 */
export const buildCertificatePdfBuffer = async (
  options: CertificateRenderOptions
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const isLandscape = options.orientation !== 'portrait';
      const doc = new PDFDocument({
        layout: isLandscape ? 'landscape' : 'portrait',
        size: 'A4',
        margin: 0,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;
      const themeKey = options.theme && THEME_PALETTES[options.theme] ? options.theme : 'modern-blue';
      const palette = THEME_PALETTES[themeKey];

      // Custom background image support
      let customBgRendered = false;
      if (options.bgImageUrl && options.bgImageUrl.startsWith('http')) {
        try {
          const resp = await axios.get(options.bgImageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
          });
          doc.image(Buffer.from(resp.data), 0, 0, { width, height });
          customBgRendered = true;
        } catch (e: any) {
          console.warn('[CertificateRenderer] Failed to load custom bg image:', e.message);
        }
      }

      if (!customBgRendered) {
        // 1. Solid canvas fill
        doc.rect(0, 0, width, height).fill(palette.bg);

        // 2. Decorative radial glows in corners
        doc.save();
        doc.circle(0, 0, 220).fillOpacity(0.12).fill(palette.primary);
        doc.circle(width, height, 220).fillOpacity(0.12).fill(palette.secondary);
        doc.circle(width, 0, 160).fillOpacity(0.08).fill(palette.primary);
        doc.circle(0, height, 160).fillOpacity(0.08).fill(palette.secondary);
        doc.restore();

        // 3. Ornate Double Border
        const margin1 = 28;
        const margin2 = 34;
        doc
          .rect(margin1, margin1, width - margin1 * 2, height - margin1 * 2)
          .lineWidth(2)
          .strokeOpacity(0.85)
          .stroke(palette.primary);

        doc
          .rect(margin2, margin2, width - margin2 * 2, height - margin2 * 2)
          .lineWidth(0.75)
          .strokeOpacity(0.4)
          .stroke(palette.border);

        // 4. Elegant Corner Accents
        const cornerSize = 22;
        const corners = [
          [margin1, margin1],
          [width - margin1, margin1],
          [margin1, height - margin1],
          [width - margin1, height - margin1],
        ];
        corners.forEach(([cx, cy]) => {
          doc.circle(cx, cy, 3).fill(palette.primary);
          doc.rect(cx - cornerSize / 2, cy - 1, cornerSize, 2).fill(palette.primary);
          doc.rect(cx - 1, cy - cornerSize / 2, 2, cornerSize).fill(palette.primary);
        });
      }

      // --- TEXT & CONTENT RENDERING ---
      doc.fillOpacity(1);

      // Institution Eyebrow
      const institution = (
        options.issuerOrganization || 'CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY'
      ).toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(palette.primary)
        .text(institution, 60, 56, { align: 'center', width: width - 120, characterSpacing: 2 });

      // Main Title
      const certTitle = (options.title || 'CERTIFICATE OF EXCELLENCE').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor(palette.textMain)
        .text(certTitle, 60, 80, { align: 'center', width: width - 120, characterSpacing: 1.5 });

      // Subtitle / Presenter Header
      const certSubtitle = options.subtitle || 'PROUDLY PRESENTED TO';
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor(palette.textMuted)
        .text(certSubtitle, 60, 122, { align: 'center', width: width - 120, characterSpacing: 1 });

      // Decorative divider rule
      const divWidth = 140;
      doc
        .rect(width / 2 - divWidth / 2, 142, divWidth, 1.5)
        .fillColor(palette.primary)
        .fill();

      // Recipient Full Name (Prominent)
      const recipient = (options.recipientName || 'STUDENT NAME').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(32)
        .fillColor(palette.primary)
        .text(recipient, 60, 160, { align: 'center', width: width - 120 });

      // Recipient Roll / ID (Optional)
      if (options.recipientRollNo) {
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor(palette.textMuted)
          .text(`Roll No: ${options.recipientRollNo}`, 60, 202, { align: 'center', width: width - 120 });
      }

      // Recognition Paragraph / Description
      const descY = options.recipientRollNo ? 226 : 216;
      const descText =
        options.description ||
        'For exceptional dedication, demonstrating advanced technical problem-solving capabilities, and meeting all certification benchmarks.';
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor(palette.textMuted)
        .text(descText, 90, descY, { align: 'center', width: width - 180, lineGap: 5 });

      // Circular Verification Seal (Bottom Left / Center)
      const sealX = 110;
      const sealY = height - 100;
      doc.save();
      doc.circle(sealX, sealY, 32).lineWidth(2).stroke(palette.primary);
      doc.circle(sealX, sealY, 28).lineWidth(0.75).stroke(palette.secondary);
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(palette.primary)
        .text('VERIFIED', sealX - 25, sealY - 9, { align: 'center', width: 50, characterSpacing: 1 });
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(palette.textMuted)
        .text('CREDENTIAL', sealX - 25, sealY + 2, { align: 'center', width: 50 });
      doc.restore();

      // Footer Meta (Date, Certificate ID, Public Verification link)
      const issueDateStr = options.issueDate
        ? new Date(options.issueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(palette.textMuted)
        .text(`Issued On: ${issueDateStr}`, 160, height - 116, { align: 'left', width: 220 })
        .text(`Certificate ID: ${options.certificateId}`, 160, height - 100, { align: 'left', width: 220 })
        .text(`Verification Code: ${options.verificationCode}`, 160, height - 84, { align: 'left', width: 220 });

      // Signatures (Right aligned)
      const sig1X = width - 260;
      const sigY = height - 110;

      // Primary Signatory line
      doc.rect(sig1X, sigY, 190, 1).fillColor(palette.textMuted).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.textMain)
        .text(options.signatoryName || 'Dr. S. K. Ramesh', sig1X, sigY + 6, {
          align: 'center',
          width: 190,
        });
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(palette.textMuted)
        .text(options.signatoryTitle || 'Faculty Advisor, Code Circle', sig1X, sigY + 20, {
          align: 'center',
          width: 190,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Uploads generated certificate to Cloudinary if CDN storage is desired.
 */
export const uploadCertificateToCloudinary = async (
  pdfBuffer: Buffer,
  certificateId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'code-circle/certificates',
        resource_type: 'raw',
        format: 'pdf',
        public_id: `cert_${certificateId.toLowerCase()}`,
      },
      (error: any, result: any) => {
        if (error || !result) {
          return reject(error || new Error('Upload failed'));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(pdfBuffer);
  });
};
