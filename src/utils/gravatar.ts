import crypto from 'crypto';

export function getGravatarUrl(email: string, size: number = 80) {
    // 1. Clean the email
    const cleanedEmail = String(email).trim().toLowerCase();
    
    // 2. Create SHA256 hash
    const hash = crypto.createHash('sha256').update(cleanedEmail).digest('hex');
    
    // 3. Return the URL with optional size parameter
    return `https://www.gravatar.com/avatar/${hash}?s=${size}`;
}