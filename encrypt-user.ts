// File: encrypt-user.ts
// Run this script with: bun run encrypt-user.ts
import crypto from "crypto";
import "dotenv/config"; // To load the .env file

interface UserPayload {
    id: number;
    name: string;
    authorizeLevel: 0 | 1 | 2;
}

// --- Users to Encrypt ---
// Add or modify users in this array and re-run the script to generate new tokens.
const usersToEncrypt: UserPayload[] = [
    { id: 1, name: "Super Admin", authorizeLevel: 2 },
    { id: 2, name: "Standard Validator", authorizeLevel: 1 },
    { id: 3, name: "Read-Only User", authorizeLevel: 0 },
];
// -------------------------

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error(
        "Encryption key is missing or not 32 characters long. Please check your .env file.",
    );
    process.exit(1);
}

const key = Buffer.from(ENCRYPTION_KEY, "utf-8");
const iv = crypto.randomBytes(16); // Generate a random IV for each encryption

function encrypt(payload: UserPayload): string {
    const text = JSON.stringify(payload);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // We combine iv, authTag, and encrypted data into a single string for storage/transport.
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

console.log("--- Generated Encrypted User Tokens ---");
console.log("Copy these tokens into your authorized-users.json file.\n");

const encryptedUsers = usersToEncrypt.map((user) => {
    const encryptedToken = encrypt(user);
    console.log(`User: ${user.name} (Level ${user.authorizeLevel})`);
    console.log(encryptedToken + "\n");
    return encryptedToken;
});

console.log("--- JSON Array for authorized-users.json ---");
console.log(JSON.stringify(encryptedUsers, null, 2));
console.log("\n--- End ---");
