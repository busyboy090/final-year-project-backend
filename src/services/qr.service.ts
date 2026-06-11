import { randomBytes } from "crypto";
import qrcode from "qrcode";

/**
 * Generate a cryptographically strong random token (hex)
 * This token will be stored on the enrollment record as qr_token.
 */
export const generateRandomToken = (bytes = 20) => {
  return randomBytes(bytes).toString("hex");
};

export const generateQrImageBase64 = async (payloadUrl: string) => {
  const dataUrl = await qrcode.toDataURL(payloadUrl, { margin: 1, width: 400 });
  return dataUrl; // data:image/png;base64,...
};

export const DEFAULT_QR_TTL = 0; // tokens are persistent by default (no TTL)
