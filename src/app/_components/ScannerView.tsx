"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { frontalCamera, QRCanvas } from "qr/dom";
import type { Socket } from "socket.io-client";
import { Button } from "~/components/ui/button";
import ValidationDialog from "./ValidationDialog";
import { Camera, StopCircle, ShieldAlert } from "lucide-react";
import { type ScanEntry } from "./HistoryView";
import { Badge } from "~/components/ui/badge";
import type { User } from "~/types";
import type { ValidationType } from "~/lib/validation";

interface ScannerViewProps {
    socket: Socket | null;
    history: ScanEntry[];
    user: User;
}

const ScannerView = ({ socket, history, user }: ScannerViewProps) => {
    const historyRef = useRef<ScanEntry[]>(history);

    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraRef = useRef<Awaited<ReturnType<typeof frontalCamera>> | null>(
        null,
    );
    const canvasRef = useRef<QRCanvas | null>(null);

    // --- State remains largely the same ---
    const [isScanning, setIsScanning] = useState(false);
    const [validationCandidate, setValidationCandidate] =
        useState<ValidationType | null>(null);
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    const canScan = user.authorizeLevel >= 1;

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    // The core scanning function, runs in a loop via requestAnimationFrame
    const scanFrame = useCallback(() => {
        // Stop the loop if the component is no longer in a scanning state
        if (!isScanning || validationCandidate) return;

        if (
            !videoRef.current ||
            !cameraRef.current ||
            !canvasRef.current ||
            videoRef.current.paused
        ) {
            return;
        }

        const frame = cameraRef.current.readFrame(canvasRef.current, true);

        if (frame) {
            videoRef.current.pause(); // Pause video to "freeze" on the scanned code
            // QR code found!
            console.log("QR code scanned:", frame);
            socket?.emit(
                "userdata-decryption",
                frame,
                (response: {
                    success: boolean;
                    message: string;
                    data?: ValidationType;
                }) => {
                    const result = response.message;
                    if (!response.success) {
                        setLastMessage(result);
                        requestAnimationFrame(scanFrame);
                        return;
                    }

                    const isDuplicate = historyRef.current.some(
                        (entry) => entry.data === result,
                    );
                    if (isDuplicate) {
                        setLastMessage(`Skipped: Already in history.`);
                        videoRef.current?.play().then(
                            () => requestAnimationFrame(scanFrame),
                            (_) => {/* Ignore */},
                        );
                        return;
                    }

                    setLastMessage(`Found: ${result.substring(0, 30)}...`);
                    setValidationCandidate(response.data!);
                },
            );
        } else {
            setLastMessage("Scanner active...");
            // No code found, request the next animation frame to continue
            requestAnimationFrame(scanFrame);
        }
    }, [isScanning, validationCandidate, socket]);

    const startScanner = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setLastMessage("Error: Camera not supported.");
            setIsScanning(false);
            return;
        }

        try {
            if (videoRef.current) {
                canvasRef.current = new QRCanvas();
                cameraRef.current = await frontalCamera(videoRef.current);

                await videoRef.current.play();
                setLastMessage("Scanner active...");
                requestAnimationFrame(scanFrame); // Start the scanning loop
            }
        } catch (err) {
            console.error("Failed to start scanner:", err);
            let message = "Error: Could not start camera.";
            if (err instanceof Error && err.name === "NotAllowedError") {
                message = "Error: Camera permission denied.";
            }
            setLastMessage(message);
            setIsScanning(false); // Revert state on error
        }
    };

    const stopScanner = useCallback(() => {
        setLastMessage("Scanner stopped.");
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (canvasRef.current) {
            canvasRef.current.clear();
            canvasRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        if (isScanning && !validationCandidate && videoRef.current?.paused) {
            videoRef.current
                .play()
                .then(() => {
                    requestAnimationFrame(scanFrame);
                })
                .catch((err) => {
                    console.error("Failed to resume video:", err);
                    setLastMessage("Error: Could not resume scanner.");
                });
        }
    }, [isScanning, validationCandidate, scanFrame]);

    useEffect(() => {
        return () => stopScanner();
    }, [stopScanner]);

    const handleValidationSubmit = (status: "Valid" | "Not Valid") => {
        if (socket && validationCandidate) {
            socket.emit("validation-submit", {
                qrData: JSON.stringify(validationCandidate),
                status,
                validatorName: "Admin",
            });
        }
        setValidationCandidate(null);
    };

    if (!canScan) {
        return (
            <div className="flex h-48 flex-col items-center justify-center text-center">
                <ShieldAlert className="mb-4 h-12 w-12 text-yellow-500" />
                <p className="font-semibold">Access Denied</p>
                <p className="text-sm text-gray-500">
                    You do not have permission to use the scanner.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-gray-200 dark:bg-gray-800">
                <video
                    ref={videoRef}
                    playsInline // Crucial for inline playback on mobile browsers
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="h-6">
                {lastMessage && (
                    <Badge variant="secondary">{lastMessage}</Badge>
                )}
            </div>
            {!isScanning ? (
                <Button
                    onClick={() => {
                        setIsScanning(true);
                        void startScanner();
                    }}
                    size="lg"
                    className="w-48"
                >
                    <Camera className="mr-2 h-5 w-5" /> Start Scanning
                </Button>
            ) : (
                <Button
                    onClick={() => {
                        setIsScanning(false);
                        stopScanner();
                    }}
                    variant="destructive"
                    size="lg"
                    className="w-48"
                >
                    <StopCircle className="mr-2 h-5 w-5" /> Stop Scanning
                </Button>
            )}
            <ValidationDialog
                isOpen={!!validationCandidate}
                qrData={validationCandidate}
                onClose={() => setValidationCandidate(null)}
                onSubmit={handleValidationSubmit}
            />
        </div>
    );
};

export default ScannerView;
