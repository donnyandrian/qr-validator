"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";
import { PaginationController } from "./PaginationController";

export interface ScanEntry {
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
interface HistoryViewProps {
    history: ScanEntry[];
    socket: Socket | null;
    user: User;
}

const HistoryView = ({ history, socket, user }: HistoryViewProps) => {
    const canDelete = user.authorizeLevel >= 2;

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredHistory = useMemo(() => {
        return history.filter(
            (entry) =>
                entry.data.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.validatorName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        );
    }, [history, searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredHistory, currentPage, itemsPerPage]);

    return (
        <div className="flex flex-1 flex-col gap-y-4 overflow-hidden">
            <Input
                placeholder="Search by data or validator name..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
                className="max-w-sm"
            />

            <div className="flex-1 overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Validator</TableHead>
                            <TableHead>Validated At</TableHead>
                            <TableHead className="text-center">
                                Status
                            </TableHead>
                            {canDelete && (
                                <TableHead className="text-center">
                                    Actions
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedHistory.length > 0 ? (
                            paginatedHistory.map((scan) => (
                                <HistoryViewRow
                                    key={scan.id}
                                    scan={scan}
                                    socket={socket}
                                    canDelete={canDelete}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={canDelete ? 5 : 4}
                                    className="h-24 text-center"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationController
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
            />
        </div>
    );
};

interface HistoryViewRowProps {
    scan: ScanEntry;
    socket: Socket | null;
    canDelete: boolean;
}
const HistoryViewRow = ({ scan, socket, canDelete }: HistoryViewRowProps) => {
    const handleDelete = (id: string) => {
        if (socket && canDelete) {
            socket.emit("delete-entry", id);
        }
    };

    return (
        <TableRow>
            <TableCell className="max-w-[200px] truncate font-medium whitespace-pre-line sm:max-w-xs">
                {prettyJsonData(scan.data)}
            </TableCell>
            <TableCell>{scan.validatorName}</TableCell>
            <TableCell>{new Date(scan.validatedAt).toLocaleString()}</TableCell>
            <TableCell className="text-center">
                <Badge
                    variant={
                        scan.status === "Valid" ? "default" : "destructive"
                    }
                >
                    {scan.status}
                </Badge>
            </TableCell>
            {canDelete && (
                <TableCell className="text-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(scan.id)}
                        aria-label="Delete entry"
                        disabled={scan.id.startsWith("mock_")}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </TableCell>
            )}
        </TableRow>
    );
};

const prettyJsonData = (json: string) => {
    const entries = Object.entries(JSON.parse(json) as Record<string, string>);
    return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
};

export default HistoryView;
