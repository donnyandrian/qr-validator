"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import {
    useDatasetKey,
    useInputDataKey,
    tableCellBuilder,
} from "~/data/client";
import { Badge } from "~/components/ui/badge";
import { PaginationController } from "./PaginationController";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowDown01, ArrowDownUp, ChevronDown, Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "~/components/ui/dropdown-menu";
import { generateCsv } from "~/actions/report";
import { toast } from "sonner";

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

const finalPresent = (
    initial: string | undefined,
    status: string | undefined,
) => {
    return initial === "Yes" && status === "Valid" ? "Yes" : "No";
};

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

                return scan.data === entry[datasetKey];
            });

            if (!lookup) return entry;

            return {
                present: "Yes",
                ...entry,
                validatorName: lookup.validatorName,
                validatedAt: lookup.validatedAt,
                status: lookup.status,
            };
        });
    }, [history, dataset, inputDataKey, datasetKey]);

    const sortedDataset = useMemo(() => {
        return [...joinedDataset].sort((a, b) =>
            finalPresent(a.present, a.status).localeCompare(
                finalPresent(b.present, b.status),
            ),
        );
    }, [joinedDataset]);

    const filteredDataset = useMemo(() => {
        if (!sortedDataset) return [];
        if (!datasetKey) return sortedDataset;
        if (!searchTerm) return sortedDataset;

        return sortedDataset.filter((entry) => {
            if (datasetKey in entry === false) return false;

            return entry[datasetKey]
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
        });
    }, [sortedDataset, datasetKey, searchTerm]);

    const totalPages = Math.ceil(filteredDataset.length / itemsPerPage);
    const paginatedDataset = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredDataset.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredDataset, currentPage, itemsPerPage]);

    const datasetKeys = useMemo(() => Object.keys(dataset[0] ?? {}), [dataset]);

    const exportCsv = useCallback(
        (sorted: boolean) => async () => {
            const data = sorted ? sortedDataset : joinedDataset;
            if (!data || data.length < 1) {
                toast.error("No data to export.");
                return;
            }

            const toastId = toast(
                `Exporting ${sorted ? "Sorted" : "Unsorted"} CSV...`,
            );

            const headers = [
                "present",
                ...datasetKeys,
                "validatorName",
                "validatedAt",
                "status",
            ] as const;
            const rows = data.map((row) =>
                headers.map((header) =>
                    header === "present"
                        ? finalPresent(row.present, row.status)
                        : header === "validatedAt"
                          ? row.validatedAt
                              ? new Date(row.validatedAt).toLocaleString()
                              : ""
                          : (row[header] ?? ""),
                ),
            );
            const blob = await generateCsv(rows, datasetKeys);
            {
                const now = new Date();
                const year = now.getFullYear().toString().padStart(4, "0");
                const month = (now.getMonth() + 1).toString().padStart(2, "0");
                const date = now.getDate().toString().padStart(2, "0");
                const timemark = year + month + date;

                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `presence_report_${timemark}.csv`;

                anchor.click();

                URL.revokeObjectURL(url);
            }

            toast.dismiss(toastId);
            toast.success(
                `${sorted ? "Sorted" : "Unsorted"} CSV exported successfully.`,
            );
        },
        [sortedDataset, joinedDataset, datasetKeys],
    );

    const exportJson = useCallback(
        (sorted: boolean) => async () => {
            const data = sorted ? sortedDataset : joinedDataset;
            if (!data || data.length < 1) {
                toast.error("No data to export.");
                return;
            }

            const toastId = toast(
                `Exporting ${sorted ? "Sorted" : "Unsorted"} JSON...`,
            );

            const rows = data.map(
                ({
                    present,
                    validatorName = "",
                    validatedAt = "",
                    status = "",
                    ...row
                }) => ({
                    present: finalPresent(present, status),
                    ...row,
                    validatorName,
                    validatedAt,
                    status,
                }),
            );
            const blob = new Blob([JSON.stringify(rows, null, 2)], {
                type: "application/json",
            });
            {
                const now = new Date();
                const year = now.getFullYear().toString().padStart(4, "0");
                const month = (now.getMonth() + 1).toString().padStart(2, "0");
                const date = now.getDate().toString().padStart(2, "0");
                const timemark = year + month + date;

                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `presence_report_${timemark}.json`;

                anchor.click();

                URL.revokeObjectURL(url);
            }

            toast.dismiss(toastId);
            toast.success(
                `${sorted ? "Sorted" : "Unsorted"} JSON exported successfully.`,
            );
        },
        [sortedDataset, joinedDataset],
    );

    return (
        <Card className="h-full overflow-hidden">
            <CardHeader className="z-10 -mt-2 flex flex-row items-center justify-between gap-2">
                <CardTitle>Presence Report</CardTitle>
                <div className="flex items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-r-none"
                        onClick={exportCsv(true)}
                    >
                        <Download />
                        <span className="sr-only">Export Sorted (.csv)</span>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8 rounded-l-none"
                            >
                                <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="mx-4 sm:mx-8">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2">
                                    <ArrowDownUp className="size-4" /> Export
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                        onClick={exportCsv(false)}
                                    >
                                        .csv
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={exportJson(false)}
                                    >
                                        .json
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="gap-2">
                                    <ArrowDown01 className="size-4" /> Export
                                    Sorted
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={exportCsv(true)}>
                                        .csv
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={exportJson(true)}
                                    >
                                        .json
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="-my-6 flex h-full flex-col overflow-hidden py-6 *:-m-6 *:p-6">
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
                                    <TableHead>Validated At</TableHead>
                                    <TableHead className="text-center">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDataset.length > 0 ? (
                                    paginatedDataset.map((scan, index) => (
                                        <ReportViewRow
                                            key={index}
                                            scan={scan}
                                        />
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
            </CardContent>
        </Card>
    );
};

interface ReportViewRowProps {
    scan: Record<string, string>;
}
const ReportViewRow = ({ scan }: ReportViewRowProps) => {
    const { present, status, validatorName, validatedAt, ...others } = scan;

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
                    {finalPresent(present, status)}
                </Badge>
            </TableCell>
            {Object.entries(others).map(([k, v], i) => (
                <TableCellComp key={i} cellK={k} cellV={v} />
            ))}
            <TableCell>{validatorName}</TableCell>
            {validatedAt && (
                <TableCell>{new Date(validatedAt).toLocaleString()}</TableCell>
            )}
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

const TableCellComp = ({ cellK, cellV }: { cellK: string; cellV: string }) => {
    if (cellK in tableCellBuilder) {
        return tableCellBuilder[cellK as keyof typeof tableCellBuilder](cellV);
    }
};

export default ReportView;
