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
  signatoryDepartment?: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  secondarySignatoryDepartment?: string;
  tertiarySignatoryName?: string;
  tertiarySignatoryTitle?: string;
  tertiarySignatoryDepartment?: string;
  certificateId: string;
  verificationCode: string;
  issueDate?: Date | string;
  theme?:
    | 'classic-ivory'
    | 'imperial-gold'
    | 'royal-sapphire'
    | 'emerald-merit'
    | 'ruby-excellence'
    | 'amethyst-prestige'
    | 'monochrome-executive'
    | 'ocean-azure'
    | 'crimson-collegiate'
    | 'nordic-frost'
    | 'champagne-vintage'
    | 'sunset-topaz'
    | 'rose-elegance'
    | 'corporate-steel'
    | 'botanical-sage'
    | 'modern-blue'
    | 'executive-gold'
    | 'cyber-dark'
    | 'emerald-minimal'
    | 'ruby-elegance'
    | 'cyber-emerald'
    | 'luxury-amethyst'
    | string;
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
  // 15 Clean, Print-Ready Light Themes
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
  'imperial-gold': {
    bg: '#FEFCE8',
    card: '#FFFFFF',
    border: '#CA8A04',
    primary: '#B45309',
    secondary: '#D97706',
    accent: '#CA8A04',
    textMain: '#1C1917',
    textMuted: '#78716C',
    seal: '#92400E',
  },
  'royal-sapphire': {
    bg: '#F0F9FF',
    card: '#FFFFFF',
    border: '#0284C7',
    primary: '#0284C7',
    secondary: '#0369A1',
    accent: '#38BDF8',
    textMain: '#0C4A6E',
    textMuted: '#475569',
    seal: '#0284C7',
  },
  'emerald-merit': {
    bg: '#F0FDF4',
    card: '#FFFFFF',
    border: '#059669',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10B981',
    textMain: '#064E3B',
    textMuted: '#4B5563',
    seal: '#059669',
  },
  'ruby-excellence': {
    bg: '#FFF1F2',
    card: '#FFFFFF',
    border: '#E11D48',
    primary: '#E11D48',
    secondary: '#BE123C',
    accent: '#FB7185',
    textMain: '#881337',
    textMuted: '#6B7280',
    seal: '#BE123C',
  },
  'amethyst-prestige': {
    bg: '#FAF5FF',
    card: '#FFFFFF',
    border: '#7C3AED',
    primary: '#7C3AED',
    secondary: '#6D28D9',
    accent: '#C084FC',
    textMain: '#4C1D95',
    textMuted: '#6B7280',
    seal: '#7C3AED',
  },
  'monochrome-executive': {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#334155',
    primary: '#0F172A',
    secondary: '#334155',
    accent: '#64748B',
    textMain: '#020617',
    textMuted: '#64748B',
    seal: '#1E293B',
  },
  'ocean-azure': {
    bg: '#F0FDFA',
    card: '#FFFFFF',
    border: '#0D9488',
    primary: '#0D9488',
    secondary: '#0F766E',
    accent: '#14B8A6',
    textMain: '#134E4A',
    textMuted: '#52525B',
    seal: '#0F766E',
  },
  'crimson-collegiate': {
    bg: '#FEF2F2',
    card: '#FFFFFF',
    border: '#991B1B',
    primary: '#991B1B',
    secondary: '#B91C1C',
    accent: '#D97706',
    textMain: '#450A0A',
    textMuted: '#57534E',
    seal: '#991B1B',
  },
  'nordic-frost': {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#0284C7',
    primary: '#0284C7',
    secondary: '#2563EB',
    accent: '#38BDF8',
    textMain: '#0F172A',
    textMuted: '#64748B',
    seal: '#0284C7',
  },
  'champagne-vintage': {
    bg: '#FAF8F5',
    card: '#FFFFFF',
    border: '#854D0E',
    primary: '#854D0E',
    secondary: '#A16207',
    accent: '#CA8A04',
    textMain: '#292524',
    textMuted: '#78716C',
    seal: '#854D0E',
  },
  'sunset-topaz': {
    bg: '#FFF7ED',
    card: '#FFFFFF',
    border: '#EA580C',
    primary: '#EA580C',
    secondary: '#C2410C',
    accent: '#F97316',
    textMain: '#431407',
    textMuted: '#78716C',
    seal: '#C2410C',
  },
  'rose-elegance': {
    bg: '#FDF2F8',
    card: '#FFFFFF',
    border: '#DB2777',
    primary: '#DB2777',
    secondary: '#BE185D',
    accent: '#F472B6',
    textMain: '#500724',
    textMuted: '#71717A',
    seal: '#BE185D',
  },
  'corporate-steel': {
    bg: '#F1F5F9',
    card: '#FFFFFF',
    border: '#334155',
    primary: '#334155',
    secondary: '#1E3A8A',
    accent: '#2563EB',
    textMain: '#0F172A',
    textMuted: '#475569',
    seal: '#334155',
  },
  'botanical-sage': {
    bg: '#F6F8F6',
    card: '#FFFFFF',
    border: '#15803D',
    primary: '#15803D',
    secondary: '#166534',
    accent: '#22C55E',
    textMain: '#14532D',
    textMuted: '#52525B',
    seal: '#15803D',
  },

  // Legacy mappings for backward compatibility
  'modern-blue': {
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
  'executive-gold': {
    bg: '#FEFCE8',
    card: '#FFFFFF',
    border: '#CA8A04',
    primary: '#B45309',
    secondary: '#D97706',
    accent: '#CA8A04',
    textMain: '#1C1917',
    textMuted: '#78716C',
    seal: '#92400E',
  },
  'cyber-emerald': {
    bg: '#F0FDF4',
    card: '#FFFFFF',
    border: '#059669',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10B981',
    textMain: '#064E3B',
    textMuted: '#4B5563',
    seal: '#059669',
  },
  'cyber-dark': {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#334155',
    primary: '#0F172A',
    secondary: '#334155',
    accent: '#64748B',
    textMain: '#020617',
    textMuted: '#64748B',
    seal: '#1E293B',
  },
  'luxury-amethyst': {
    bg: '#FAF5FF',
    card: '#FFFFFF',
    border: '#7C3AED',
    primary: '#7C3AED',
    secondary: '#6D28D9',
    accent: '#C084FC',
    textMain: '#4C1D95',
    textMuted: '#6B7280',
    seal: '#7C3AED',
  },
  'ruby-elegance': {
    bg: '#FFF1F2',
    card: '#FFFFFF',
    border: '#E11D48',
    primary: '#E11D48',
    secondary: '#BE123C',
    accent: '#FB7185',
    textMain: '#881337',
    textMuted: '#6B7280',
    seal: '#BE123C',
  },
  'emerald-minimal': {
    bg: '#F0FDF4',
    card: '#FFFFFF',
    border: '#059669',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10B981',
    textMain: '#064E3B',
    textMuted: '#4B5563',
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
      const themeKey = options.theme && THEME_PALETTES[options.theme] ? options.theme : 'classic-ivory';
      const palette = THEME_PALETTES[themeKey];

      // Ensure PDF viewers open at 100% true zoom
      try {
        if ((doc as any)._root && (doc as any)._root.data) {
          (doc as any)._root.data.OpenAction = [(doc.page as any).dictionary, 'XYZ', null, null, 1.0];
        }
      } catch (zoomErr: any) {
        // Fallback silently if OpenAction dictionary is unavailable
      }

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
        // 1. Pristine Full Canvas Fill (Ivory / Theme Background)
        doc.rect(0, 0, width, height).fill(palette.bg);

        // 2. Decorative radial glows in corners
        doc.save();
        doc.circle(0, 0, 240).fillOpacity(0.12).fill(palette.primary);
        doc.circle(width, height, 240).fillOpacity(0.12).fill(palette.secondary);
        doc.circle(width, 0, 180).fillOpacity(0.08).fill(palette.accent || palette.primary);
        doc.circle(0, height, 180).fillOpacity(0.08).fill(palette.secondary);
        doc.restore();

        // 3. Ornate Double Border Frame (Matching original certificate design)
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
          .strokeOpacity(0.55)
          .stroke(palette.secondary);

        // 4. Elegant Corner Accents (Cross bars and Gemstone pins)
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

      // 3. Official Club Circular Badge at top center
      const candidateLogoPaths = [
        path.resolve(__dirname, '../../../frontend/public/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), 'frontend/public/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), '../frontend/public/codecirclelogo.jpeg'),
        path.resolve(__dirname, '../../public/codecirclelogo.jpeg'),
        path.resolve(__dirname, '../../assets/codecirclelogo.jpeg'),
        path.resolve(__dirname, '../assets/codecirclelogo.jpeg'),
        path.resolve(__dirname, '../../../frontend/public/codecirclelogo.png'),
        path.resolve(process.cwd(), 'frontend/public/codecirclelogo.png'),
        path.resolve(process.cwd(), 'assets/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), 'backend/assets/codecirclelogo.jpeg'),
        path.resolve(process.cwd(), 'backend/public/codecirclelogo.jpeg'),
      ];
      const clubLogoPath = candidateLogoPaths.find((p) => fs.existsSync(p));

      // Responsive Coordinates for Landscape vs Portrait
      const logoSize = 56;
      const logoY = isLandscape ? 50 : 66;

      if (clubLogoPath) {
        try {
          const logoX = width / 2 - logoSize / 2;

          doc.save();
          doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip();
          doc.image(clubLogoPath, logoX, logoY, { width: logoSize, height: logoSize });
          doc.restore();

          doc
            .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2)
            .lineWidth(1.5)
            .strokeColor(palette.primary)
            .strokeOpacity(0.25)
            .stroke();
        } catch (imgErr: any) {
          console.warn('[CertificateRenderer] Failed to render club logo:', imgErr.message);
        }
      }

      // Vertical spacing layout with balanced breathing room
      const eyebrowY = isLandscape ? 118 : 144;
      const titleY = isLandscape ? 138 : 170;
      const subtitleY = isLandscape ? 172 : 210;
      const divY = isLandscape ? 192 : 234;
      const recipientY = isLandscape ? 242 : 296;
      const rollY = isLandscape ? 286 : 344;
      const descY = isLandscape ? (options.recipientRollNo ? 316 : 304) : (options.recipientRollNo ? 380 : 364);

      // 4. Institution Eyebrow
      const institution = (
        options.issuerOrganization || 'CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY'
      ).toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.primary)
        .text(institution, 50, eyebrowY, {
          align: 'center',
          width: width - 100,
          characterSpacing: 2.4,
        });

      // 5. Main Title
      const certTitle = (options.title || 'CERTIFICATE OF ACHIEVEMENT').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor(palette.textMain)
        .text(certTitle, 50, titleY, {
          align: 'center',
          width: width - 100,
          characterSpacing: 1.3,
        });

      // 6. Subtitle / Presenter Header
      const certSubtitle = (options.subtitle || 'PROUDLY PRESENTED TO').toUpperCase();
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(palette.textMuted)
        .text(certSubtitle, 50, subtitleY, {
          align: 'center',
          width: width - 100,
          characterSpacing: 2.0,
        });

      // 7. Decorative Accent Divider Pill (Matching exact rounded gold bar in studio)
      const divWidth = 60;
      const divHeight = 3;
      doc
        .roundedRect(width / 2 - divWidth / 2, divY, divWidth, divHeight, 1.5)
        .fillColor(palette.secondary || palette.primary)
        .fill();

      // 8. Recipient Full Name (Prominent & Vibrant Primary Color)
      const recipient = (options.recipientName || 'STUDENT NAME').toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(32)
        .fillColor(palette.primary)
        .text(recipient, 50, recipientY, { align: 'center', width: width - 100 });

      // 9. Recipient Roll / ID (Optional)
      if (options.recipientRollNo) {
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor(palette.textMuted)
          .text(`Roll No: ${options.recipientRollNo}`, 50, rollY, {
            align: 'center',
            width: width - 100,
          });
      }

      // 10. Recognition Paragraph / Description
      const descText =
        options.description ||
        'For exceptional technical competence, sustained dedication, and active participation in advanced club initiatives.';
      const descWidth = isLandscape ? 520 : 460;
      doc
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor(palette.textMuted)
        .text(descText, width / 2 - descWidth / 2, descY, {
          align: 'center',
          width: descWidth,
          lineGap: 4.5,
        });

      // 11. Footer Meta (Date, Certificate ID)
      const d = options.issueDate ? new Date(options.issueDate) : new Date();
      const issueDateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

      // --- FOOTER: Horizontal Verification Strip & Three Faculty Signatories ---
      const stripY = isLandscape ? 466 : height - 150;
      const contentInset = 50;
      const contentWidth = width - contentInset * 2;

      // Top dividing line for verification strip
      doc
        .rect(contentInset, stripY, contentWidth, 0.75)
        .fillColor(palette.primary)
        .fillOpacity(0.2)
        .fill();

      doc.fillOpacity(1);

      // Vector Shield Icon with Checkmark (Exact match for ShieldCheck icon)
      const shieldX = contentInset + 6;
      const shieldY = stripY + 6;
      doc.save();
      doc.translate(shieldX, shieldY);
      doc
        .path('M 0,2.5 L 5.5,0.5 L 11,2.5 L 11,6.5 C 11,10 5.5,12.5 5.5,12.5 C 5.5,12.5 0,10 0,6.5 Z')
        .lineWidth(1)
        .strokeColor(palette.primary)
        .stroke();
      doc
        .path('M 3,6 L 5,8 L 8.5,4')
        .lineWidth(1.2)
        .strokeColor(palette.primary)
        .stroke();
      doc.restore();

      // Left text: VERIFIED INSTITUTIONAL CREDENTIAL
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(palette.primary)
        .text('VERIFIED INSTITUTIONAL CREDENTIAL', contentInset + 22, stripY + 7);

      // Right text: ID & DATE
      const rightMetaText = `ID: ${options.certificateId} · DATE: ${issueDateStr}`;
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.textMuted)
        .text(rightMetaText, contentInset, stripY + 7, {
          align: 'right',
          width: contentWidth - 4,
        });

      // Bottom dividing line for verification strip
      doc
        .rect(contentInset, stripY + 22, contentWidth, 0.75)
        .fillColor(palette.primary)
        .fillOpacity(0.2)
        .fill();

      // --- THREE FACULTY SIGNATURES SIDE BY SIDE ---
      const sigLineY = stripY + 32;
      const colWidth = (contentWidth - 40) / 3;
      const barW = 72;

      // Faculty 1: Faculty Coordinator
      const sig1X = contentInset;
      doc
        .rect(sig1X + (colWidth - barW) / 2, sigLineY, barW, 1.5)
        .fillColor(palette.primary)
        .fillOpacity(0.55)
        .fill();
      doc.fillOpacity(1);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.textMain)
        .text(options.signatoryName || 'Dr. Dhanasekar R', sig1X, sigLineY + 6, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(palette.primary)
        .text(options.signatoryTitle || 'Faculty Coordinator', sig1X, sigLineY + 19, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.textMuted)
        .fillOpacity(0.65)
        .text(options.signatoryDepartment || 'Faculty Coordinator · EIE', sig1X, sigLineY + 30, {
          align: 'center',
          width: colWidth,
        });
      doc.fillOpacity(1);

      // Faculty 2: Faculty Coordinator
      const sig2X = contentInset + colWidth + 20;
      doc
        .rect(sig2X + (colWidth - barW) / 2, sigLineY, barW, 1.5)
        .fillColor(palette.primary)
        .fillOpacity(0.55)
        .fill();
      doc.fillOpacity(1);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.textMain)
        .text(options.secondarySignatoryName || 'Dr. Nandhini K M', sig2X, sigLineY + 6, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(palette.primary)
        .text(options.secondarySignatoryTitle || 'Faculty Coordinator', sig2X, sigLineY + 19, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.textMuted)
        .fillOpacity(0.65)
        .text(options.secondarySignatoryDepartment || 'Faculty Coordinator · EIE', sig2X, sigLineY + 30, {
          align: 'center',
          width: colWidth,
        });
      doc.fillOpacity(1);

      // Faculty 3: Faculty Coordinator
      const sig3X = contentInset + (colWidth + 20) * 2;
      doc
        .rect(sig3X + (colWidth - barW) / 2, sigLineY, barW, 1.5)
        .fillColor(palette.primary)
        .fillOpacity(0.55)
        .fill();
      doc.fillOpacity(1);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(palette.textMain)
        .text(options.tertiarySignatoryName || 'Prof. RATHNA S', sig3X, sigLineY + 6, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(palette.primary)
        .text(options.tertiarySignatoryTitle || 'Faculty Coordinator', sig3X, sigLineY + 19, {
          align: 'center',
          width: colWidth,
        });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(palette.textMuted)
        .fillOpacity(0.65)
        .text(options.tertiarySignatoryDepartment || 'Faculty Coordinator · CSE', sig3X, sigLineY + 30, {
          align: 'center',
          width: colWidth,
        });
      doc.fillOpacity(1);

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
