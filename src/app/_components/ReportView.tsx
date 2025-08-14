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
import { Input } from "~/components/ui/input";
import type { Socket } from "socket.io-client";
import { useDatasetKey, useInputDataKey } from "~/data/client";
import type { ValidationType } from "~/lib/validation";
import { Badge } from "~/components/ui/badge";
import { PaginationController } from "./PaginationController";

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
        if (!searchTerm) return joinedDataset;

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

    const datasetKeys = useMemo(() => Object.keys(dataset[0] ?? {}), [dataset]);

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
                            {datasetKeys.map((key) => (
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
                            paginatedDataset.map((scan, index) => (
                                <ReportViewRow key={index} scan={scan} />
                            ))
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

            <PaginationController
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
            />
        </div>
    );
};

interface ReportViewRowProps {
    scan: Record<string, string>;
}
const ReportViewRow = ({ scan }: ReportViewRowProps) => {
    const { present, status, validatorName, ...others } = scan;

    return (
        <TableRow>
            <TableCell className="text-center">
                <Badge
                    variant={
                        present === "Yes" && status === "Valid"
                            ? "default"
                            : "destructive"
                    }
                >
                    {present === "Yes" && status === "Valid" ? "Yes" : "No"}
                </Badge>
            </TableCell>
            {Object.values(others).map((value, i) => (
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
                        variant={status === "Valid" ? "default" : "destructive"}
                    >
                        {status}
                    </Badge>
                )}
            </TableCell>
        </TableRow>
    );
};

export default ReportView;
