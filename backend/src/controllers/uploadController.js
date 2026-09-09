const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadProfilePic = async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    
    // Cloudinary upload using stream for efficiency
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'code-circle-profiles' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(buffer);
    
    return reply.send({ url: result.secure_url });
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
    
    // Cloudinary upload for certificate templates
    const uploadToCloudinary = (buffer) => {
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
        uploadStream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(buffer);
    
    return reply.send({ success: true, url: result.secure_url });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Upload of certificate template failed' });
  }
};

module.exports = { uploadProfilePic, uploadCertificateTemplate };
