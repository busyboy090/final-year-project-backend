import jwt from 'jsonwebtoken';
import config from '../configs/env.ts';

export interface TokenPayload {
  userId: string | number;
  email?: string;
  role?: string;
  type?: string; // Added to support your verifyTempTokenController("type") logic
  [key: string]: any; 
}

// --- Generators ---

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.ACCESS_TOKEN_SECRET as string, { expiresIn: '1h' });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' });
};

/**
 * Used for Email Verification, Password Resets, and MFA setup.
 */
export const generateTempToken = (payload: TokenPayload, expiresIn: string = "15m"): string => {
  return jwt.sign(payload, config.TEMP_TOKEN_SECRET as string, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const generateEmailToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.EMAIL_TOKEN_SECRET as string, { expiresIn: '7d' });
};

// --- Verifiers ---

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.ACCESS_TOKEN_SECRET as string) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET as string) as TokenPayload;
};

export const verifyTempToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.TEMP_TOKEN_SECRET as string) as TokenPayload;
};

export const verifyEmailToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.EMAIL_TOKEN_SECRET as string) as TokenPayload;
};