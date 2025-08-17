"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import ScannerView from "./_components/ScannerView";
import HistoryView, { type ScanEntry } from "./_components/HistoryView";
import ReportView from "./_components/ReportView";
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
    const canReport = user.authorizeLevel >= 2;
    return (
        <main className="flex h-dvh min-h-screen flex-col items-center justify-center bg-gray-100 p-4 sm:p-8 dark:bg-gray-900">
            <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden">
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
                    className="h-full w-full overflow-hidden"
                >
                    <TabsList className="flex w-full *:flex-1">
                        {canScan && (
                            <TabsTrigger value="scanner">Scanner</TabsTrigger>
                        )}
                        <TabsTrigger value="history">History</TabsTrigger>
                        {canReport && (
                            <TabsTrigger value="report">Report</TabsTrigger>
                        )}
                    </TabsList>

                    {canScan && (
                        <TabsContent
                            value="scanner"
                            className="flex flex-col overflow-hidden"
                        >
                            <Card className="h-full overflow-hidden">
                                <CardHeader>
                                    <CardTitle>Scan QR Code</CardTitle>
                                </CardHeader>
                                <CardContent className="-mt-6 -mb-14 flex h-full flex-col justify-center overflow-hidden pt-6 pb-14 *:-m-6 *:p-6">
                                    <ScannerView
                                        socket={socket}
                                        history={history}
                                        user={user}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    <TabsContent
                        value="history"
                        className="flex flex-col overflow-hidden"
                    >
                        <Card className="h-full overflow-hidden">
                            <CardHeader>
                                <CardTitle>Scan History</CardTitle>
                            </CardHeader>
                            <CardContent className="-my-6 flex h-full flex-col overflow-hidden py-6 *:-m-6 *:p-6">
                                <HistoryView
                                    history={history}
                                    socket={socket}
                                    user={user}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {canReport && (
                        <TabsContent
                            value="report"
                            className="flex flex-col overflow-hidden"
                        >
                            <ReportView history={history} />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </main>
    );
}
