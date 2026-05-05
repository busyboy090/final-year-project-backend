import multer from 'multer';

// Files are stored in memory as Buffers, not on disk or Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit 5MB
  }
});