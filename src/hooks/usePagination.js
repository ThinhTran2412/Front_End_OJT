import { useState } from "react";

export function usePagination(totalItems, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const nextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () =>
    setCurrentPage((p) => Math.max(p - 1, 1));
  const goToPage = (page) =>
    setCurrentPage(() => Math.min(Math.max(page, 1), totalPages));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
  };
}
