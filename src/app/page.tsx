"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import ScannerView from "./_components/ScannerView";
import HistoryView, { type ScanEntry } from "./_components/HistoryView";
import AuthView from "./_components/AuthView";
import { Button } from "~/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import type { User } from "~/types";

const AUTH_TOKEN_KEY = "qr-validator-auth-token";

export default function HomePage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [history, setHistory] = useState<ScanEntry[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const socketUrl = window.location.origin;
        const newSocket = io(socketUrl, {
            path: "/api/socket_io",
            transports: ["websocket"],
        });
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("✅ Connected to server");

            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (storedToken) {
                console.log(
                    "Found stored token. Attempting to authenticate...",
                );
                newSocket.emit(
                    "authenticate",
                    storedToken,
                    (response: { success: boolean; user?: User }) => {
                        if (response.success && response.user) {
                            console.log("Auto-authentication successful.");
                            setUser(response.user);
                        } else {
                            console.log("Stored token is invalid. Clearing...");
                            localStorage.removeItem(AUTH_TOKEN_KEY);
                        }
                        setIsLoading(false);
                    },
                );
            } else {
                setIsLoading(false);
            }
        });

        newSocket.on("history-update", (updatedHistory: ScanEntry[]) =>
            setHistory(updatedHistory),
        );
        newSocket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setIsLoading(false);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleAuthSuccess = (authedUser: User, token: string) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        setUser(authedUser);
    };

    const handleSignOut = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    // If not authenticated after loading, show the login screen
    if (!user) {
        return <AuthView socket={socket} onAuthSuccess={handleAuthSuccess} />;
    }

    // If authenticated, show the main app
    const canScan = user.authorizeLevel >= 1;
    return (
        <main className="flex min-h-screen h-dvh flex-col items-center justify-center bg-gray-100 p-4 sm:p-8 dark:bg-gray-900">
            <div className="w-full max-w-4xl overflow-hidden flex flex-col h-full">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        PreMark
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-500">
                                Level {user.authorizeLevel}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSignOut}
                            aria-label="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Tabs
                    defaultValue={canScan ? "scanner" : "history"}
                    className="w-full h-full overflow-hidden"
                >
                    <TabsList
                        className={`grid w-full ${canScan ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                        {canScan && (
                            <TabsTrigger value="scanner">Scanner</TabsTrigger>
                        )}
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    {canScan && (
                        <TabsContent value="scanner" className="overflow-hidden flex flex-col">
                            <Card className="overflow-hidden h-full">
                                <CardHeader>
                                    <CardTitle>Scan QR Code</CardTitle>
                                </CardHeader>
                                <CardContent className="overflow-hidden h-full flex flex-col justify-center *:-m-6 *:p-6 -mt-6 pt-6 -mb-14 pb-14">
                                    <ScannerView
                                        socket={socket}
                                        history={history}
                                        user={user}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    <TabsContent value="history" className="overflow-hidden flex flex-col">
                        <Card className="overflow-hidden h-full">
                            <CardHeader>
                                <CardTitle>Scan History</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-hidden h-full flex flex-col *:-m-6 *:p-6 -my-6 py-6">
                                <HistoryView
                                    history={history}
                                    socket={socket}
                                    user={user}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}
