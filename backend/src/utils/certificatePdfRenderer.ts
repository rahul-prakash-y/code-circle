// @ts-ignore
import PDFDocument from 'pdfkit';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
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
  tertiarySignatoryName?: string;
  tertiarySignatoryTitle?: string;
  certificateId: string;
  verificationCode: string;
  issueDate?: Date | string;
  theme?:
    | 'modern-blue'
    | 'executive-gold'
    | 'cyber-dark'
    | 'emerald-minimal'
    | 'ruby-elegance'
    | 'royal-sapphire'
    | 'cyber-emerald'
    | 'luxury-amethyst'
    | 'classic-ivory';
  orientation?: 'landscape' | 'portrait';
  bgImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

const THEME_PALETTES: Record<string, {
  bg: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  textMain: string;
  textMuted: string;
  seal: string;
}> = {
  'royal-sapphire': {
    bg: '#050B1B',
    card: '#0A122B',
    border: '#1E3A8A',
    primary: '#38BDF8',
    secondary: '#F59E0B',
    accent: '#60A5FA',
    textMain: '#FFFFFF',
    textMuted: '#94A3B8',
    seal: '#0284C7',
  },
  'modern-blue': {
    bg: '#070E22',
    card: '#0E1A3C',
    border: '#2563EB',
    primary: '#38BDF8',
    secondary: '#FBBF24',
    accent: '#60A5FA',
    textMain: '#FFFFFF',
    textMuted: '#94A3B8',
    seal: '#0284C7',
  },
  'executive-gold': {
    bg: '#111113',
    card: '#18181B',
    border: '#CA8A04',
    primary: '#FACC15',
    secondary: '#EAB308',
    accent: '#FDE68A',
    textMain: '#FFFBEB',
    textMuted: '#D4D4D8',
    seal: '#B45309',
  },
  'cyber-emerald': {
    bg: '#020C08',
    card: '#051E14',
    border: '#059669',
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    textMain: '#FFFFFF',
    textMuted: '#A7F3D0',
    seal: '#047857',
  },
  'cyber-dark': {
    bg: '#030712',
    card: '#081120',
    border: '#10B981',
    primary: '#34D399',
    secondary: '#065F46',
    accent: '#6EE7B7',
    textMain: '#FFFFFF',
    textMuted: '#9CA3AF',
    seal: '#059669',
  },
  'luxury-amethyst': {
    bg: '#0C061A',
    card: '#170D30',
    border: '#7C3AED',
    primary: '#C084FC',
    secondary: '#EC4899',
    accent: '#E879F9',
    textMain: '#FAF5FF',
    textMuted: '#DDD6FE',
    seal: '#9333EA',
  },
  'ruby-elegance': {
    bg: '#17050A',
    card: '#290A14',
    border: '#E11D48',
    primary: '#FB7185',
    secondary: '#F43F5E',
    accent: '#FDA4AF',
    textMain: '#FFF1F2',
    textMuted: '#FECDD3',
    seal: '#BE123C',
  },
  'classic-ivory': {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#1E40AF',
    primary: '#1E3A8A',
    secondary: '#D97706',
    accent: '#3B82F6',
    textMain: '#0F172A',
    textMuted: '#475569',
    seal: '#B45309',
  },
  'emerald-minimal': {
    bg: '#F0FDF4',
    card: '#FFFFFF',
    border: '#059669',
    primary: '#047857',
    secondary: '#0D9488',
    accent: '#10B981',
    textMain: '#064E3B',
    textMuted: '#374151',
    seal: '#059669',
  },
};

/**
 * Builds an in-memory PDF Buffer using PDFKit with enterprise typography,
 * club logo embed, vibrant luxury palette, and three faculty member signatures.
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
      const themeKey = options.theme && THEME_PALETTES[options.theme] ? options.theme : 'royal-sapphire';
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
        doc.circle(0, 0, 240).fillOpacity(0.14).fill(palette.primary);
        doc.circle(width, height, 240).fillOpacity(0.14).fill(palette.secondary);
        doc.circle(width, 0, 180).fillOpacity(0.09).fill(palette.accent || palette.primary);
        doc.circle(0, height, 180).fillOpacity(0.09).fill(palette.secondary);
        doc.restore();

        // 3. Ornate Double Border
        const margin1 = 26;
        const margin2 = 32;
        doc
          .rect(margin1, margin1, width - margin1 * 2, height - margin1 * 2)
          .lineWidth(2.5)
          .strokeOpacity(0.9)
          .stroke(palette.primary);

        doc
          .rect(margin2, margin2, width - margin2 * 2, height - margin2 * 2)
          .lineWidth(0.85)
          .strokeOpacity(0.5)
          .stroke(palette.secondary);

        // 4. Elegant Corner Accents
        const cornerSize = 24;
        const corners = [
          [margin1, margin1],
          [width - margin1, margin1],
          [margin1, height - margin1],
          [width - margin1, height - margin1],
        ];
        corners.forEach(([cx, cy]) => {
          doc.circle(cx, cy, 3.5).fill(palette.primary);
          doc.rect(cx - cornerSize / 2, cy - 1, cornerSize, 2).fill(palette.secondary);
          doc.rect(cx - 1, cy - cornerSize / 2, 2, cornerSize).fill(palette.secondary);
        });
      }

      // --- TEXT & CONTENT RENDERING ---
      doc.fillOpacity(1);

      // 5. Club Logo: Render @frontend/public/codecirclelogo.jpeg at top center
      const candidateLogoPaths = [
        path.resolve(__dirname, '../../../frontend/public/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), 'frontend/public/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), '../frontend/public/codecirclelogo.jpeg'),
        path.resolve(__dirname, '../../public/codecirclelogo.jpeg'),
      ];
      const clubLogoPath = candidateLogoPaths.find((p) => fs.existsSync(p));

      let contentStartY = 50;
      if (clubLogoPath) {
        try {
          const logoSize = 44;
          const logoX = width / 2 - logoSize / 2;
          const logoY = 36;
          doc.image(clubLogoPath, logoX, logoY, { width: logoSize, height: logoSize });
          contentStartY = 88;
        } catch (imgErr: any) {
          console.warn('[CertificateRenderer] Failed to render club logo:', imgErr.message);
        }
      }

      // Institution Eyebrow
      const institution = (
        options.issuerOrganization || 'CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY'
      ).toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.primary)
        .text(institution, 60, contentStartY, { align: 'center', width: width - 120, characterSpacing: 2.2 });

      // Main Title
      const certTitle = (options.title || 'CERTIFICATE OF EXCELLENCE').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(25)
        .fillColor(palette.textMain)
        .text(certTitle, 60, contentStartY + 20, { align: 'center', width: width - 120, characterSpacing: 1.5 });

      // Subtitle / Presenter Header
      const certSubtitle = options.subtitle || 'PROUDLY PRESENTED TO';
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(palette.textMuted)
        .text(certSubtitle, 60, contentStartY + 52, { align: 'center', width: width - 120, characterSpacing: 1.2 });

      // Decorative divider rule
      const divWidth = 130;
      doc
        .rect(width / 2 - divWidth / 2, contentStartY + 68, divWidth, 1.5)
        .fillColor(palette.secondary)
        .fill();

      // Recipient Full Name (Prominent & Vibrant)
      const recipient = (options.recipientName || 'STUDENT NAME').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor(palette.primary)
        .text(recipient, 60, contentStartY + 78, { align: 'center', width: width - 120 });

      // Recipient Roll / ID (Optional)
      let descY = contentStartY + 114;
      if (options.recipientRollNo) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(palette.textMuted)
          .text(`Roll No: ${options.recipientRollNo}`, 60, descY, { align: 'center', width: width - 120 });
        descY += 18;
      }

      // Recognition Paragraph / Description
      const descText =
        options.description ||
        'For exceptional dedication, demonstrating advanced technical problem-solving capabilities, and meeting all certification benchmarks.';
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(palette.textMuted)
        .text(descText, 85, descY, { align: 'center', width: width - 170, lineGap: 4.5 });

      // Circular Verification Seal (Bottom Left)
      const sealX = 95;
      const sealY = height - 126;
      doc.save();
      doc.circle(sealX, sealY, 26).lineWidth(2).stroke(palette.primary);
      doc.circle(sealX, sealY, 22).lineWidth(0.75).stroke(palette.secondary);
      doc
        .font('Helvetica-Bold')
        .fontSize(6.5)
        .fillColor(palette.primary)
        .text('VERIFIED', sealX - 22, sealY - 8, { align: 'center', width: 44, characterSpacing: 1 });
      doc
        .font('Helvetica')
        .fontSize(5.5)
        .fillColor(palette.textMuted)
        .text('CREDENTIAL', sealX - 22, sealY + 2, { align: 'center', width: 44 });
      doc.restore();

      // Footer Meta (Date, Certificate ID, Verification Code)
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
        .fontSize(8.5)
        .fillColor(palette.textMuted)
        .text(`Issued On: ${issueDateStr}`, 135, height - 140, { align: 'left', width: 220 })
        .text(`Certificate ID: ${options.certificateId}`, 135, height - 127, { align: 'left', width: 220 })
        .text(`Verification Code: ${options.verificationCode}`, 135, height - 114, { align: 'left', width: 220 });

      // --- THREE FACULTY MEMBERS SIGNATURES (Spaced across bottom) ---
      const sigY = height - 72;
      const colWidth = 205;

      // Faculty 1: Faculty Coordinator
      const sig1X = 55;
      doc.rect(sig1X, sigY, colWidth, 1).fillColor(palette.border).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(palette.textMain)
        .text(options.signatoryName || 'Dr. S. K. Ramesh', sig1X, sigY + 5, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.primary)
        .text(options.signatoryTitle || 'Faculty Coordinator & Club In-charge', sig1X, sigY + 17, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(palette.textMuted)
        .text('Department of CSE · BIT', sig1X, sigY + 27, {
          align: 'center',
          width: colWidth,
        });

      // Faculty 2: Faculty Advisor & Head of Department
      const sig2X = (width - colWidth) / 2;
      doc.rect(sig2X, sigY, colWidth, 1).fillColor(palette.border).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(palette.textMain)
        .text(options.secondarySignatoryName || 'Dr. P. Balasubramanie', sig2X, sigY + 5, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.primary)
        .text(options.secondarySignatoryTitle || 'Faculty Advisor & Head of Dept, CSE', sig2X, sigY + 17, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(palette.textMuted)
        .text('Bannari Amman Institute of Technology', sig2X, sigY + 27, {
          align: 'center',
          width: colWidth,
        });

      // Faculty 3: Principal & Club Patron
      const sig3X = width - 55 - colWidth;
      doc.rect(sig3X, sigY, colWidth, 1).fillColor(palette.border).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(palette.textMain)
        .text(options.tertiarySignatoryName || 'Dr. C. Palanisamy', sig3X, sigY + 5, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.primary)
        .text(options.tertiarySignatoryTitle || 'Principal & Club Patron', sig3X, sigY + 17, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(palette.textMuted)
        .text('Bannari Amman Institute of Technology', sig3X, sigY + 27, {
          align: 'center',
          width: colWidth,
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
