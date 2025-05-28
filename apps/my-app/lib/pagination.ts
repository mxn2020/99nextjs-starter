
export const ITEMS_PER_PAGE = 10; // Default items per page

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function getPaginationMeta(totalItems: number, currentPage: number, itemsPerPage: number = ITEMS_PER_PAGE): PaginationMeta {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
    