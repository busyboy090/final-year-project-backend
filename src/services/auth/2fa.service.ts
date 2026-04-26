import { generateSecret, verify, generateURI } from "otplib";
import QRCode from 'qrcode';
import config from "../../configs/env.ts";

export const generate2FASecret = (email: string) => {
    const secret = generateSecret();
    const otpauth = generateURI({
        label: email,
        issuer: config.NAME,
        secret
    });
    return { secret, otpauth };
};

export const generateQRCode = async (otpauth: string) => {
    return await QRCode.toDataURL(otpauth);
};

export const verify2FAToken = (token: string, secret: string) => {
    return verify({ token, secret });
};