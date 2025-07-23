// File: server.ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --- Persistence Setup ---
const historyFilePath = path.join(process.cwd(), "history.json");

interface QrScan {
    id: string;
    data: string;
    validatorName: string;
    validatedAt: string;
    status: "Valid" | "Not Valid";
}

// Function to read history from the file
const readHistoryFromFile = (): QrScan[] => {
    try {
        if (fs.existsSync(historyFilePath)) {
            const fileContent = fs.readFileSync(historyFilePath, "utf-8");
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error("Error reading history file:", error);
    }
    return []; // Return empty array if file doesn't exist or has errors
};

// Function to write history to the file
const writeHistoryToFile = (history: QrScan[]) => {
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error("Error writing to history file:", error);
    }
};

// Load initial history from file
let scanHistory: QrScan[] = readHistoryFromFile();
// --- End Persistence Setup ---

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

        // Send the current history to the newly connected client
        socket.emit("history-update", scanHistory);

        socket.on(
            "validation-submit",
            (data: {
                qrData: string;
                status: "Valid" | "Not Valid";
                validatorName: string;
            }) => {
                console.log("📝 Validation Submitted:", data);
                const newScan: QrScan = {
                    id: `scan_${Date.now()}`,
                    data: data.qrData,
                    status: data.status,
                    validatorName: data.validatorName,
                    validatedAt: new Date().toISOString(),
                };

                scanHistory.unshift(newScan);
                writeHistoryToFile(scanHistory); // Persist changes
                io.emit("history-update", scanHistory); // Broadcast to all clients
                console.log("📢 Broadcasted history-update after validation.");
            },
        );

        // --- NEW: Handle Delete Event ---
        socket.on("delete-entry", (idToDelete: string) => {
            console.log(`🗑️ Received request to delete entry: ${idToDelete}`);
            const initialLength = scanHistory.length;
            scanHistory = scanHistory.filter(
                (entry) => entry.id !== idToDelete,
            );

            if (scanHistory.length < initialLength) {
                writeHistoryToFile(scanHistory); // Persist changes
                io.emit("history-update", scanHistory); // Broadcast the updated list
                console.log(
                    `📢 Broadcasted history-update after deleting ${idToDelete}.`,
                );
            }
        });
        // --- End Delete Event Handler ---

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.id);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, hostname, () => {
            console.log(
                `> Server listening on all interfaces at http://<your-ip-address>:${port}`,
            );
            console.log(`> History is being persisted to: ${historyFilePath}`);
        });
});
