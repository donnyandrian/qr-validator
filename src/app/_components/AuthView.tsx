// File: app/_components/AuthView.tsx
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Socket } from "socket.io-client";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Upload } from "lucide-react";

interface User {
    id: number;
    name: string;
    authorizeLevel: 0 | 1 | 2;
}

interface AuthViewProps {
    socket: Socket | null;
    onAuthSuccess: (user: User, token: string) => void;
}

// This ID is still required for the library to initialize, even if not visible.
const authQrReaderId = "auth-qr-reader";

const AuthView = ({ socket, onAuthSuccess }: AuthViewProps) => {
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    // useRef to hold the scanner instance.
    const scannerRef = useRef<Html5Qrcode | null>(null);
    // useRef to link the button to the hidden file input.
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const attemptAuth = (authToken: string) => {
        if (!socket || !authToken) return;
        setError("");
        socket.emit(
            "authenticate",
            authToken,
            (response: { success: boolean; user?: User; message?: string }) => {
                if (response.success && response.user) {
                    onAuthSuccess(response.user, authToken);
                } else {
                    setError(response.message || "Authentication failed.");
                }
            },
        );
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        // Lazy-initialize the scanner instance if it doesn't exist
        if (!scannerRef.current) {
            // The first argument (elementId) is required, so we provide our hidden div's ID.
            scannerRef.current = new Html5Qrcode(authQrReaderId, {
                verbose: false,
            });
        }

        try {
            const decodedText = await scannerRef.current.scanFile(
                file,
                /* showImage= */ false,
            );
            setToken(decodedText);
            attemptAuth(decodedText);
        } catch (err) {
            console.error("Error scanning file:", err);
            setError("Could not read QR code from the selected file.");
        }

        // Reset the file input so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
            {/* This div is required by Html5Qrcode for its internal operations, even if not visible. */}
            <div id={authQrReaderId} style={{ display: "none" }}></div>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                    <CardDescription>
                        Provide your access token by pasting it or uploading a
                        QR code image.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            placeholder="Enter encrypted token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && attemptAuth(token)
                            }
                        />
                        <Button
                            onClick={() => attemptAuth(token)}
                            className="w-full"
                        >
                            Authenticate
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="text-muted-foreground bg-white px-2 dark:bg-gray-950">
                                Or
                            </span>
                        </div>
                    </div>

                    <div>
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        {/* Button that triggers the file input */}
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="w-full"
                        >
                            <Upload className="mr-2 h-4 w-4" /> Upload Auth QR
                            Code
                        </Button>
                    </div>

                    {error && (
                        <p className="text-center text-sm font-medium text-red-500">
                            {error}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthView;
