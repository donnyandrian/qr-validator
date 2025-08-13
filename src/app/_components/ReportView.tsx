/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Socket } from "socket.io-client";
import { useDatasetKey, useInputDataKey } from "~/data/client";
import type { ValidationType } from "~/lib/validation";
import { Badge } from "~/components/ui/badge";

export interface ScanEntry {
    id: string;
    data: string;
    validatorName: string;
    validatedAt: string;
    status: "Valid" | "Not Valid";
}
interface ReportViewProps {
    history: ScanEntry[];
    socket: Socket | null;
}

const ReportView = ({ history, socket }: ReportViewProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [dataset, setDataset] = useState<Record<string, string>[]>([]);
    const inputDataKey = useInputDataKey();
    const datasetKey = useDatasetKey();
    const itemsPerPage = 10;

    useEffect(() => {
        if (!socket) return;

        socket.emit(
            "init-dataset",
            (response: Record<string, string>[] | Error) => {
                if (Array.isArray(response)) {
                    setDataset(response);
                } else {
                    console.error("Error fetching dataset: ", response);
                }
            },
        );
    }, [socket]);

    const joinedDataset = useMemo(() => {
        return dataset.map((entry) => {
            const lookup = history.find((scan) => {
                if (!inputDataKey) return false;
                if (!datasetKey) return false;
                if (datasetKey in entry === false) return false;

                const parsed = JSON.parse(scan.data) as ValidationType;
                return parsed[inputDataKey] === entry[datasetKey];
            });

            if (!lookup) return entry;

            return {
                present: "Yes",
                ...entry,
                validatorName: lookup.validatorName,
                status: lookup.status,
            };
        });
    }, [history, dataset, inputDataKey, datasetKey]);

    const filteredDataset = useMemo(() => {
        if (!joinedDataset) return [];
        if (!datasetKey) return joinedDataset;

        return joinedDataset.filter((entry) => {
            if (datasetKey in entry === false) return false;

            return entry[datasetKey]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
        });
    }, [joinedDataset, datasetKey, searchTerm]);

    const totalPages = Math.ceil(filteredDataset.length / itemsPerPage);
    const paginatedDataset = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDataset.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDataset, currentPage, itemsPerPage]);

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="flex flex-1 flex-col gap-y-4 overflow-hidden">
            <Input
                placeholder={`Search by ${datasetKey}...`}
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
                            <TableHead className="text-center">
                                Present
                            </TableHead>
                            {Object.keys(dataset[0] ?? {}).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                            ))}
                            <TableHead>Validator</TableHead>
                            <TableHead className="text-center">
                                Status
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedDataset.length > 0 ? (
                            paginatedDataset.map(
                                (
                                    { present, validatorName, status, ...scan },
                                    index,
                                ) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    present === "Yes"
                                                        ? "default"
                                                        : "destructive"
                                                }
                                            >
                                                {present || "No"}
                                            </Badge>
                                        </TableCell>
                                        {Object.values(scan).map((value, i) => (
                                            <TableCell
                                                key={i}
                                                className="max-w-[200px] truncate whitespace-pre-line sm:max-w-xs"
                                            >
                                                {value}
                                            </TableCell>
                                        ))}
                                        <TableCell>{validatorName}</TableCell>
                                        <TableCell className="text-center">
                                            {status && (
                                                <Badge
                                                    variant={
                                                        status === "Valid"
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                >
                                                    {status}
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ),
                            )
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="h-24 text-center"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end gap-x-2">
                <span className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next</span>
                </Button>
            </div>
        </div>
    );
};

export default ReportView;
