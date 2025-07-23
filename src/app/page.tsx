// File: app/page.tsx
// The only change here is passing the `socket` state down to the HistoryView component.
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import ScannerView from "./_components/ScannerView";
import HistoryView, { type ScanEntry } from "./_components/HistoryView";

export default function HomePage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [history, setHistory] = useState<ScanEntry[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const socketUrl = window.location.origin;

        const newSocket = io(socketUrl, {
            path: "/api/socket_io",
            transports: ["websocket"],
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log(
                "✅ Connected to server via WebSocket with ID:",
                newSocket.id,
                "at",
                socketUrl,
            );
        });

        newSocket.on("history-update", (updatedHistory: ScanEntry[]) => {
            console.log("Received history update");
            setHistory(updatedHistory);
        });

        newSocket.on("connect_error", (err) => {
            console.error(
                "Socket connection error:",
                err.message,
                "URL:",
                socketUrl,
            );
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 sm:p-8 dark:bg-gray-900">
            <div className="w-full max-w-4xl">
                <h1 className="mb-8 text-center text-4xl font-bold text-gray-800 dark:text-gray-200">
                    Real-Time QR Validator
                </h1>
                <Tabs defaultValue="scanner" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="scanner">Scanner</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="scanner">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scan QR Code</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScannerView
                                    socket={socket}
                                    history={history}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Scan History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* CHANGE: Pass the socket prop to the history view */}
                                <HistoryView
                                    history={history}
                                    socket={socket}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
