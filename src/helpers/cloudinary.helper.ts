import cloudinary from '../config/cloudinary.ts';
import { Readable } from 'stream';

export class CloudinaryHelper {
  /**
   * Uploads a buffer to Cloudinary using a Promise-wrapped stream
   */
  private static uploadBuffer(buffer: Buffer, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      // Create a readable stream from the buffer and pipe it to Cloudinary
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  }

  /**
   * Ideal for venue thumbnails
   */
  static async uploadSingle(file: Express.Multer.File, folder: string = 'adun-ems/venues'): Promise<string> {
    const result = await this.uploadBuffer(file.buffer, folder);
    return result.secure_url;
  }

  /**
   * Ideal for venue gallery images
   */
  static async uploadMultiple(files: Express.Multer.File[], folder: string = 'adun-ems/venues/gallery'): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadBuffer(file.buffer, folder));
    const results = await Promise.all(uploadPromises);
    return results.map((res: any) => res.secure_url);
  }
}