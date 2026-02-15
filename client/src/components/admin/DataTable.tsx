"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { FiSearch, FiChevronUp, FiChevronDown, FiEdit2, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "./ConfirmDialog";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends { _id: string }> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  basePath: string;
  onDelete?: (id: string) => Promise<void>;
  searchPlaceholder?: string;
}

export default function DataTable<T extends { _id: string }>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  basePath,
  onDelete,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");

  const totalPages = Math.ceil(totalCount / pageSize);
  const currentSort = searchParams.get("sort") || "";
  const currentOrder = searchParams.get("order") || "asc";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchValue || null, page: null });
  };

  const handleSort = (key: string) => {
    const newOrder = currentSort === key && currentOrder === "asc" ? "desc" : "asc";
    updateParams({ sort: key, order: newOrder, page: null });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage > 1 ? String(newPage) : null });
  };

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-teal text-white text-sm rounded-lg hover:bg-teal/90 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left font-medium text-gray-600 ${col.className || ""} ${
                      col.sortable ? "cursor-pointer select-none hover:text-gray-800" : ""
                    }`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && currentSort === col.key && (
                        currentOrder === "asc" ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`${basePath}/${item._id}`)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`${basePath}/${item._id}`)}
                          className="p-2 text-gray-500 hover:text-teal rounded-lg hover:bg-gray-100"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => setDeleteId(item._id)}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <button
                  onClick={() => handlePageChange(page - 1)}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  Prev
                </button>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 text-sm rounded-lg ${
                      page === pageNum ? "bg-teal text-white font-bold" : "bg-white border hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {page < totalPages && (
                <button
                  onClick={() => handlePageChange(page + 1)}
                  className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </div>
  );
}
