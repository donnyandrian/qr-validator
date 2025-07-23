// File: app/_components/ValidationDialog.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface ValidationDialogProps {
    isOpen: boolean;
    qrData: string | null;
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Validate QR Code</DialogTitle>
                    <DialogDescription>
                        A QR code has been scanned. Please validate its content.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                        <span className="font-semibold">Scanned Data:</span>
                        <p className="w-full rounded-md bg-gray-100 p-3 text-sm break-words text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {qrData}
                        </p>
                    </div>
                </div>
                <DialogFooter>
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
