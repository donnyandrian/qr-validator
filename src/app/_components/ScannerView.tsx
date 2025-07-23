"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Socket } from "socket.io-client";
import { Button } from "~/components/ui/button";
import ValidationDialog from "./ValidationDialog";
import { Camera, StopCircle, ShieldAlert } from "lucide-react";
import { type ScanEntry } from "./HistoryView";
import { Badge } from "~/components/ui/badge";
import type { User } from "~/types";

interface ScannerViewProps {
    socket: Socket | null;
    history: ScanEntry[];
    user: User;
}

const qrReaderId = "qr-reader";

const ScannerView = ({ socket, history, user }: ScannerViewProps) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const historyRef = useRef<ScanEntry[]>(history);
    const [isScanning, setIsScanning] = useState(false);
    const [validationCandidate, setValidationCandidate] = useState<
        string | null
    >(null);
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    const canScan = user.authorizeLevel >= 1;

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    const startScanner = async () => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(qrReaderId, {
                verbose: false,
            });
        }
        const scanner = scannerRef.current;

        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
            return;
        }

        const qrCodeSuccessCallback = (decodedText: string) => {
            if (validationCandidate) return;

            const isDuplicate = historyRef.current.some(
                (entry) => entry.data === decodedText,
            );
            if (isDuplicate) {
                setLastMessage(`Skipped: Already in history.`);
                return;
            }

            setLastMessage(`Found: ${decodedText.substring(0, 30)}...`);
            setValidationCandidate(decodedText);
        };

        try {
            await scanner.start(
                { facingMode: "environment" },
                { fps: 5, qrbox: { width: 250, height: 250 } },
                qrCodeSuccessCallback,
                (_) => {
                    /* ignore errors */
                },
            );
            setLastMessage("Scanner active...");
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setLastMessage("Error: Could not start camera.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                setLastMessage("Scanner stopped.");
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
    };

    useEffect(() => {
        const scanner = scannerRef.current;
        if (!scanner) return;

        if (
            validationCandidate &&
            scanner.getState() === Html5QrcodeScannerState.SCANNING
        ) {
            scanner.pause(true);
        } else if (
            !validationCandidate &&
            isScanning &&
            scanner.getState() === Html5QrcodeScannerState.PAUSED
        ) {
            scanner.resume();
        }
    }, [validationCandidate, isScanning]);

    const handleValidationSubmit = (status: "Valid" | "Not Valid") => {
        if (socket && validationCandidate) {
            socket.emit("validation-submit", {
                qrData: validationCandidate,
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
            <div
                id={qrReaderId}
                className="aspect-square w-full max-w-sm overflow-hidden rounded-lg border-2 border-dashed bg-gray-200 dark:bg-gray-800"
            ></div>
            <div className="h-6">
                {lastMessage && (
                    <Badge variant="secondary">{lastMessage}</Badge>
                )}
            </div>
            {!isScanning ? (
                <Button
                    onClick={() => {
                        setIsScanning(true);
                        startScanner();
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
