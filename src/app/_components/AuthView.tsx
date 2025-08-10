"use client";

import { useState, useRef, type ChangeEvent } from "react";
import type { Socket } from "socket.io-client";
import { decodeQR } from "qr/decode";
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
import type { User } from "~/types";

interface AuthViewProps {
    socket: Socket | null;
    onAuthSuccess: (user: User, token: string) => void;
}

const fileToImageData = async (file: File) => {
    // Create an ImageBitmap from the file
    const imageBitmap = await createImageBitmap(file);

    // Create a canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Failed to get canvas context");
    }

    // Draw the ImageBitmap onto the canvas
    ctx.drawImage(imageBitmap, 0, 0);

    // Get the ImageData from the canvas
    return ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
};

const AuthView = ({ socket, onAuthSuccess }: AuthViewProps) => {
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
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
                    setError(response.message ?? "Authentication failed.");
                }
            },
        );
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const imageData = await fileToImageData(file);
            const decodedText = decodeQR(imageData);
            setToken(decodedText);
            attemptAuth(decodedText);
        } catch (error) {
            console.log("Error decoding QR code: ", error);
            setError("Could not read QR code from the selected file.");
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
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
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
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
