import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a memory buffer directly to Cloudinary using a stream.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Destination folder on Cloudinary (e.g. 'sportconnect/avatars')
 * @returns {Promise<Object>} - Cloudinary upload result object
 */
export const uploadBufferToCloudinary = (buffer, folder = 'sportconnect') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export default cloudinary;
