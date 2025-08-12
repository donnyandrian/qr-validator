// Run this script with: bun run encrypt-user.ts
import crypto from "crypto";
import "dotenv/config";

interface UserPayload {
    id: number;
    name: string;
    authorizeLevel: 0 | 1 | 2;
}

// --- Users to Encrypt ---
// Add or modify users in this array and re-run the script to generate new tokens.
const usersToEncrypt: UserPayload[] = [];
// -------------------------

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error(
        "Encryption key is missing or not 32 characters long. Please check your .env file.",
    );
    process.exit(1);
}

const key = Buffer.from(ENCRYPTION_KEY, "utf-8");
const iv = crypto.randomBytes(16);

function encrypt(payload: UserPayload): string {
    const text = JSON.stringify(payload);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString("base64");
}

console.log("--- Generated Encrypted User Tokens ---");
console.log("Copy these tokens into your authorized-users.json file.\n");

const forQr: { name: string; token: string }[] = [];

const encryptedUsers = usersToEncrypt.map((user) => {
    const encryptedToken = encrypt(user);
    console.log(`User: ${user.name} (Level ${user.authorizeLevel})`);
    console.log(encryptedToken + "\n");

    forQr.push({
        name: user.name,
        token: encryptedToken,
    });

    return encryptedToken;
});

console.log("--- JSON Array for authorized-users.json ---");
console.log(JSON.stringify(encryptedUsers, null, 2));
console.log("\n--- End ---\n");

console.log("--- QR Code Data ---");
console.log(JSON.stringify(forQr, null, 2));
console.log("\n--- End ---");
