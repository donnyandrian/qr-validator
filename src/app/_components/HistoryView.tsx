"use client";

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
import { Trash2 } from "lucide-react";
import { Socket } from "socket.io-client";

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

    const handleDelete = (id: string) => {
        if (socket && canDelete) {
            socket.emit("delete-entry", id);
        }
    };

    return (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            <Table>
                <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                        <TableHead>QR Data</TableHead>
                        <TableHead>Validator</TableHead>
                        <TableHead>Validated At</TableHead>
                        <TableHead>Status</TableHead>
                        {/* Only render the Actions column header if the user can delete */}
                        {canDelete && (
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.length > 0 ? (
                        history.map((scan) => (
                            <TableRow key={scan.id}>
                                <TableCell className="max-w-[200px] truncate font-medium sm:max-w-xs">
                                    {scan.data}
                                </TableCell>
                                <TableCell>{scan.validatorName}</TableCell>
                                <TableCell>
                                    {new Date(
                                        scan.validatedAt,
                                    ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            scan.status === "Valid"
                                                ? "default"
                                                : "destructive"
                                        }
                                    >
                                        {scan.status}
                                    </Badge>
                                </TableCell>
                                {/* Only render the delete button cell if the user can delete */}
                                {canDelete && (
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleDelete(scan.id)
                                            }
                                            aria-label="Delete entry"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={canDelete ? 5 : 4}
                                className="h-24 text-center"
                            >
                                No scans yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default HistoryView;
