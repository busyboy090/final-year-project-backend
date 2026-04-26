import crypto from "crypto";
import redis from "../../configs/redis.ts";

export const OTPService = {
  /**
   * Generates a secure 6-digit OTP and stores its hash in Redis
   */
  generateOTP: async (identifier: string, expirySeconds: number = 600): Promise<string> => {
    // 1. Generate a cryptographically secure 6-digit number (100000 to 999999)
    const otp = crypto.randomInt(100000, 999999).toString();

    // 2. Hash it for storage
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // 3. Store in Redis
    const key = `otp:${identifier}`;
    await redis.setex(key, expirySeconds, hashedOtp);

    return otp;
  },

  /**
   * Manual deletion of a specific OTP
   */
  deleteOTP: async (identifier: string): Promise<void> => {
    await redis.del(`otp:${identifier}`);
  },

  /**
   * Verification logic
   */
  verifyOTP: async (identifier: string, submittedOtp: string): Promise<boolean> => {
    const key = `otp:${identifier}`;
    const storedHashedOtp = await redis.get(key);

    if (!storedHashedOtp) return false;

    const submittedHashedOtp = crypto.createHash('sha256').update(submittedOtp).digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    const isMatch = crypto.timingSafeEqual(
        Buffer.from(storedHashedOtp, 'hex'),
        Buffer.from(submittedHashedOtp, 'hex')
    );

    if (isMatch) {
      await redis.del(key); // Auto-delete on success
      return true;
    }

    return false;
  }
};