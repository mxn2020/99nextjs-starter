
"use client";
import { Button } from '@99packages/ui/components/button';
import { getPaginationMeta, type PaginationMeta } from '@/lib/pagination';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@99packages/ui/components/select"
interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  className?: string;
  showItemsPerPageSelector?: boolean;
}
export default function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  showItemsPerPageSelector = false,
}: PaginationControlsProps) {
  const meta = getPaginationMeta(totalItems, currentPage, itemsPerPage);
  if (meta.totalPages <= 1 && totalItems <= itemsPerPage) {
    return null;
  }
  const handleFirst = () => onPageChange(1);
  const handlePrevious = () => onPageChange(meta.currentPage - 1);
  const handleNext = () => onPageChange(meta.currentPage + 1);
  const handleLast = () => onPageChange(meta.totalPages);
  const pageNumbers = [];
  const maxPagesToShow = 5;
  const halfMaxPages = Math.floor(maxPagesToShow / 2);
  let startPage = Math.max(1, meta.currentPage - halfMaxPages);
  let endPage = Math.min(meta.totalPages, meta.currentPage + halfMaxPages);
  if (meta.currentPage <= halfMaxPages) {
    endPage = Math.min(meta.totalPages, maxPagesToShow);
  }
  if (meta.currentPage + halfMaxPages >= meta.totalPages) {
    startPage = Math.max(1, meta.totalPages - maxPagesToShow + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground ${className}`}>
      <div className="flex-1 min-w-0">
        <span className="hidden sm:inline">
          Showing{' '}
          <strong>{Math.min((meta.currentPage - 1) * meta.itemsPerPage + 1, totalItems)}</strong>
          {' '}-{' '}
          <strong>{Math.min(meta.currentPage * meta.itemsPerPage, totalItems)}</strong>
          {' '}of <strong>{totalItems}</strong> results
        </span>
        <span className="sm:hidden">
          <strong>{Math.min((meta.currentPage - 1) * meta.itemsPerPage + 1, totalItems)}</strong>
          {' '}-{' '}
          <strong>{Math.min(meta.currentPage * meta.itemsPerPage, totalItems)}</strong>
          {' '}of <strong>{totalItems}</strong>
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {showItemsPerPageSelector && onItemsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">Rows:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleFirst}
            disabled={!meta.hasPreviousPage}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevious}
            disabled={!meta.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {startPage > 1 && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)}>1</Button>
              {startPage > 2 && <span className="px-1.5 text-muted-foreground">...</span>}
            </>
          )}

          <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === meta.currentPage ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>

          <div className="sm:hidden">
            <span className="px-2 py-1 text-sm">
              Page {meta.currentPage} of {meta.totalPages}
            </span>
          </div>

          {endPage < meta.totalPages && (
            <>
              {endPage < meta.totalPages - 1 && <span className="px-1.5 text-muted-foreground hidden sm:inline">...</span>}
              <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => onPageChange(meta.totalPages)}>{meta.totalPages}</Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNext}
            disabled={!meta.hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleLast}
            disabled={!meta.hasNextPage}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
