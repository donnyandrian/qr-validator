import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PaginationControllerProps {
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}
export const PaginationController = ({
    currentPage,
    totalPages,
    setCurrentPage,
}: PaginationControllerProps) => {
    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    return (
        <div className="flex items-center justify-end gap-x-2">
            <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
            >
                <ChevronLeft />
                <span className="sr-only">Previous</span>
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
            >
                <ChevronRight />
                <span className="sr-only">Next</span>
            </Button>
        </div>
    );
};