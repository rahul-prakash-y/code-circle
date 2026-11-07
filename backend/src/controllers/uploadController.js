const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_TEMPLATE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024; // 10MB

const validateFile = (data, buffer, allowedMimes, maxBytes) => {
  if (!data || !buffer || buffer.length === 0) {
    return 'Uploaded file is empty or corrupted';
  }

  const mime = (data.mimetype || '').toLowerCase();
  if (!allowedMimes.includes(mime)) {
    return `Invalid file type "${mime}". Allowed types: ${allowedMimes.join(', ')}`;
  }

  const filename = (data.filename || '').toLowerCase();
  const extMatch = filename.match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';

  const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'js', 'mjs', 'cjs', 'ts', 'php', 'phtml', 'html', 'htm', 'jar'];
  if (dangerousExtensions.includes(ext)) {
    return 'File extension not permitted for security reasons';
  }

  if (buffer.length > maxBytes) {
    return `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxBytes / (1024 * 1024)}MB`;
  }

  return null;
};

const uploadProfilePic = async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const validationError = validateFile(data, buffer, ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES);
    if (validationError) {
      return reply.status(400).send({ success: false, error: validationError });
    }

    // Cloudinary upload using stream for efficiency
    const uploadToCloudinary = (buf) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'code-circle-profiles', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(buf);
      });
    };

    const result = await uploadToCloudinary(buffer);

    return reply.send({ success: true, url: result.secure_url });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Upload to Cloudinary failed' });
  }
};

const uploadCertificateTemplate = async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No template file uploaded' });
    }

    const buffer = await data.toBuffer();
    const validationError = validateFile(data, buffer, ALLOWED_TEMPLATE_MIMES, MAX_TEMPLATE_BYTES);
    if (validationError) {
      return reply.status(400).send({ success: false, error: validationError });
    }

    const uploadToCloudinary = (buf) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'code-circle-certificate-templates',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(buf);
      });
    };

    const result = await uploadToCloudinary(buffer);

    return reply.send({ success: true, url: result.secure_url });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Upload of certificate template failed' });
  }
};

const uploadArenaDesignImage = async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No design image uploaded' });
    }

    const buffer = await data.toBuffer();
    const validationError = validateFile(data, buffer, ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES);
    if (validationError) {
      return reply.status(400).send({ success: false, error: validationError });
    }

    const uploadToCloudinary = (buf) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'code-circle-arena-designs',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(buf);
      });
    };

    const result = await uploadToCloudinary(buffer);

    return reply.send({ success: true, url: result.secure_url });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Upload of design image failed' });
  }
};

module.exports = { uploadProfilePic, uploadCertificateTemplate, uploadArenaDesignImage };
