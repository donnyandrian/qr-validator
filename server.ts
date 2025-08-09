import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import "dotenv/config";
import { validate } from "~/lib/validation";

// --- Server Setup ---
const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --- Interfaces ---
interface QrScan {
    id: string;
    data: string;
    validatorName: string;
    validatedAt: string;
    status: "Valid" | "Not Valid";
}
interface User {
    id: number;
    name: string;
    authorizeLevel: 0 | 1 | 2;
}

// --- Persistence ---
const historyFilePath = path.join(process.cwd(), "history.json");

const readHistoryFromFile = (): QrScan[] => {
    try {
        if (fs.existsSync(historyFilePath)) {
            const fileContent = fs.readFileSync(historyFilePath, "utf-8");
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error("Error reading history file:", error);
    }
    return [];
};

const writeHistoryToFile = (history: QrScan[]) => {
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error("Error writing to history file:", error);
    }
};

let scanHistory: QrScan[] = readHistoryFromFile();

// --- Authentication ---
const authorizedUsersPath = path.join(process.cwd(), "authorized-users.json");
const authorizedTokens: string[] = JSON.parse(
    fs.readFileSync(authorizedUsersPath, "utf-8"),
);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("Encryption key is invalid. Check .env file.");
}
const key = Buffer.from(ENCRYPTION_KEY, "utf-8");
const userdataKey = Buffer.from(process.env.USERDATA_ENCRYPTION_KEY!, "utf-8");

function decrypt(token: string, _key: Buffer): string | null {
    try {
        const combined = Buffer.from(token, "base64");

        // Extract the iv, authTag, and encrypted data from the combined buffer
        const iv = combined.subarray(0, 16);
        const authTag = combined.subarray(16, 32);
        const encrypted = combined.subarray(32);

        if (!iv || !authTag || !encrypted) return null;

        const decipher = crypto.createDecipheriv("aes-256-gcm", _key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);
        return decrypted.toString("utf8");
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}

// --- Main App ---
app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error handling request:", err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });

    const io = new Server(httpServer, {
        path: "/api/socket_io",
        transports: ["websocket"],
        cors: {
            origin: "*",
        },
    });

    io.on("connection", (socket) => {
        console.log("✅ Client connected:", socket.id);

        socket.on("authenticate", (token: string, callback) => {
            if (authorizedTokens.includes(token)) {
                const decrypted = decrypt(token, key);
                if (decrypted) {
                    const user = JSON.parse(decrypted) as User;
                    console.log(
                        `✅ Auth success for ${user.name} (Level ${user.authorizeLevel})`,
                    );
                    socket.data.user = user;
                    callback({ success: true, user });
                    socket.emit("history-update", scanHistory);
                    return;
                }
            }
            console.log(
                `❌ Auth failed for token: ${token.substring(0, 20)}...`,
            );
            callback({ success: false, message: "Invalid token." });
        });

        socket.on("userdata-decryption", (data: string, callback) => {
            const decrypted = decrypt(data, userdataKey);
            if (!decrypted) {
                callback({ success: false, message: "Decryption failed." });
                return;
            }

            const schemaValidation = validate(decrypted);
            if (!schemaValidation.success) {
                callback({
                    success: false,
                    message: schemaValidation.error.message,
                });
                return;
            }

            callback({
                success: true,
                message: decrypted,
                data: schemaValidation.value,
            });
        });

        socket.on(
            "validation-submit",
            (data: { qrData: string; status: "Valid" | "Not Valid" }) => {
                const user: User | undefined = socket.data.user;
                if (!user || user.authorizeLevel < 1) {
                    console.log(
                        `🚫 Unauthorized validation attempt by user:`,
                        user,
                    );
                    return;
                }

                const isDuplicate = scanHistory.some(
                    (entry) => entry.data === data.qrData,
                );
                if (isDuplicate) return;

                const newScan: QrScan = {
                    id: `scan_${Date.now()}`,
                    data: data.qrData,
                    status: data.status,
                    validatorName: user.name,
                    validatedAt: new Date().toISOString(),
                };
                scanHistory.unshift(newScan);
                writeHistoryToFile(scanHistory);
                io.emit("history-update", scanHistory);
            },
        );

        socket.on("delete-entry", (idToDelete: string) => {
            const user: User | undefined = socket.data.user;
            if (!user || user.authorizeLevel < 2) {
                console.log(`🚫 Unauthorized delete attempt by user:`, user);
                return;
            }

            const initialLength = scanHistory.length;
            scanHistory = scanHistory.filter(
                (entry) => entry.id !== idToDelete,
            );
            if (scanHistory.length < initialLength) {
                writeHistoryToFile(scanHistory);
                io.emit("history-update", scanHistory);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.id);
        });
    });

    httpServer.listen(port, hostname, () => {
        console.log(
            `> Server listening on all interfaces at http://<your-ip-address>:${port}`,
        );
        console.log(`> History is being persisted to: ${historyFilePath}`);
    });
});
