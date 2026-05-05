import crypto from "crypto";
import redis from "../../config/redis.ts";

type OTPType = "mfa" | "email_verification" | "password_reset";

export const OTPService = {
  /**
   * Generates a secure 6-digit OTP with Incremental Cooldown
   */
  generateOTP: async (
    identifier: string,
    type: OTPType,
    expirySeconds: number = 600,
    baseCooldown: number = 60
  ): Promise<{ otp: string; cooldownRemaining?: number }> => {
    const otpKey = `otp:${type}:${identifier}`;
    const cooldownKey = `cooldown:${type}:${identifier}`;
    const attemptsKey = `attempts:${type}:${identifier}`;

    // 1. Check current cooldown
    const ttl = await redis.ttl(cooldownKey);

    if (ttl > 0) {
      // IMPORTANT: If they click while locked, we increase the attempts 
      // to penalize the "spamming" behavior.
      await redis.incr(attemptsKey);
      return { otp: "", cooldownRemaining: ttl + 1 };
    }

    // 2. Increment attempt count for a legitimate or new request
    const attempts = await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, 86400); // 24h reset

    // 3. Calculate the New Incremental Cooldown
    // Attempt 1: 60s, Attempt 2: 120s, etc.
    const incrementalCooldown = baseCooldown * attempts;

    // 4. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // 5. Save with the NEW calculated cooldown
    await redis.multi()
      .setex(otpKey, expirySeconds, hashedOtp)
      .setex(cooldownKey, incrementalCooldown, 'locked')
      .exec();

    return { otp, cooldownRemaining: incrementalCooldown };
  },

  /**
   * Verification logic
   */
  verifyOTP: async (identifier: string, type: string, submittedOtp: string): Promise<boolean> => {
    const otpKey = `otp:${type}:${identifier}`;
    const attemptsKey = `attempts:${type}:${identifier}`;
    const cooldownKey = `cooldown:${type}:${identifier}`;

    const storedHashedOtp = await redis.get(otpKey);
    if (!storedHashedOtp) return false;

    const submittedHashedOtp = crypto.createHash('sha256').update(submittedOtp).digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(storedHashedOtp, 'hex'),
      Buffer.from(submittedHashedOtp, 'hex')
    );

    if (isMatch) {
      // SUCCESS: Clear everything including the attempts counter
      await redis.del(otpKey);
      await redis.del(cooldownKey);
      await redis.del(attemptsKey);
      return true;
    }

    return false;
  },

  // getCooldown and deleteOTP remain largely the same, 
  // but deleteOTP should also clear the attemptsKey.
  deleteOTP: async (identifier: string, type: string): Promise<void> => {
    await redis.del(`otp:${type}:${identifier}`);
    await redis.del(`cooldown:${type}:${identifier}`);
    await redis.del(`attempts:${type}:${identifier}`);
  },

  getCooldown: async (identifier: string, type: string): Promise<number> => {
    const ttl = await redis.ttl(`cooldown:${type}:${identifier}`);
    return ttl > 0 ? ttl + 1 : 0;
  }
};