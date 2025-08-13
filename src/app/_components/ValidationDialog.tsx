"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import type { ValidationType } from "~/lib/validation";
import { BuiltComp } from "~/data/client";

interface ValidationDialogProps {
    isOpen: boolean;
    qrData: ValidationType | null;
    onClose: () => void;
    onSubmit: (status: "Valid" | "Not Valid") => void;
}

const ValidationDialog = ({
    isOpen,
    qrData,
    onClose,
    onSubmit,
}: ValidationDialogProps) => {
    if (!isOpen || !qrData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="xs:max-w-[425px] xs:max-h-[80dvh] max-h-[100dvh] w-[100dvw] not-xs:max-w-[100dvw] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Validate Scanned Data</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 overflow-hidden flex-1">
                    <div className="flex flex-col items-center gap-2 justify-start overflow-auto">
                        <div className="contents">
                            {Object.entries(qrData).map(([key, value]) => (
                                <p
                                    key={key}
                                    className="w-full rounded-md bg-gray-100 p-3 text-sm break-words text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                >
                                    {value}
                                </p>
                            ))}

                            <BuiltComp entry={qrData} />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-row justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onSubmit("Not Valid")}
                    >
                        Not Valid
                    </Button>
                    <Button onClick={() => onSubmit("Valid")}>Valid</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ValidationDialog;
