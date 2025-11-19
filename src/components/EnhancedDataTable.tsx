import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ProfessionalPagination } from './ui/professional-pagination';
import { showToast } from '../lib/toast';
import { useDebounce } from '../hooks/useDebounce';

export interface EnhancedColumn {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  render?: (value: any, row: any, index?: number) => React.ReactNode;
  sortFn?: (a: any, b: any) => number;
  filterFn?: (value: any, filterValue: string) => boolean;
}

export interface EnhancedDataTableProps {
  title?: string;
  columns: EnhancedColumn[];
  data: any[] | undefined;
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  className?: string;
  emptyMessage?: string;
  loadingRows?: number;
  showInfo?: boolean;
  customActions?: React.ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function EnhancedDataTable({
  title,
  columns,
  data = [],
  loading = false,
  searchable = true,
  exportable = true,
  selectable = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick,
  onSelectionChange,
  className = '',
  emptyMessage = 'Không có dữ liệu',
  loadingRows = 5,
  showInfo = true,
  customActions
}: EnhancedDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnFilters] = useState<Record<string, string>>({});
  const [visibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );

  // Filtered and sorted data
  const processedData = useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Global search
    if (debouncedSearchQuery) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          return value?.toString().toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        })
      );
    }

    // Column filters
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        const column = columns.find(col => col.key === columnKey);
        filtered = filtered.filter(row => {
          const value = row[columnKey];
          if (column?.filterFn) {
            return column.filterFn(value, filterValue);
          }
          return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Sorting
    if (sortState.column && sortState.direction) {
      const column = columns.find(col => col.key === sortState.column);
      filtered.sort((a, b) => {
        if (column?.sortFn) {
          return sortState.direction === 'asc' 
            ? column.sortFn(a[sortState.column!], b[sortState.column!])
            : column.sortFn(b[sortState.column!], a[sortState.column!]);
        }
        
        const aVal = a[sortState.column!];
        const bVal = b[sortState.column!];
        
        if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, debouncedSearchQuery, sortState, columnFilters, columns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / currentPageSize);
  const startIndex = (currentPage - 1) * currentPageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + currentPageSize);

  // Visible columns
  const displayColumns = columns.filter(col => visibleColumns.has(col.key));

  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortState(prev => {
      if (prev.column === columnKey) {
        if (prev.direction === 'asc') return { column: columnKey, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column: columnKey, direction: 'asc' };
    });
  }, [columns]);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(row => row.id || row._id)));
    }
  }, [paginatedData, selectedRows.size]);

  const handleSelectRow = useCallback((rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  }, [selectedRows]);

  const handleExport = useCallback(() => {
    if (!data || data.length === 0) {
      showToast.warning('Không có dữ liệu để export');
      return;
    }
    
    try {
      const csvContent = [
        displayColumns.map(col => col.header).join(','),
        ...processedData.map(row => 
          displayColumns.map(col => {
            const value = row[col.key];
            // Handle different value types and escape properly
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Remove any React elements or complex objects, just get text content
            const cleanValue = stringValue.replace(/<[^>]*>/g, '').replace(/\[object Object\]/g, '');
            // Escape quotes and wrap in quotes if contains comma, newline, or quote
            return cleanValue.includes(',') || cleanValue.includes('\n') || cleanValue.includes('"')
              ? `"${cleanValue.replace(/"/g, '""')}"` 
              : cleanValue;
          }).join(',')
        )
      ].join('\n');

      // Add UTF-8 BOM for Excel to properly display Vietnamese characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `${title || 'data'}_${timestamp}.csv`;
      
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success toast
      showToast.success(`Export ${processedData.length} bản ghi thành công`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast.error('Không thể export dữ liệu. Vui lòng thử lại');
    }
  }, [data, processedData, displayColumns, title]);

  // Update selection callback
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = data?.filter(row => selectedRows.has(row.id || row._id)) || [];
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange]);

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(loadingRows)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                {displayColumns.map((_, j) => (
                  <div key={j} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        {/* Header */}
        {(showInfo || searchable || exportable || (selectable && selectedRows.size > 0)) && (
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {showInfo && (
                <div>
                  {title && <CardTitle className="text-xl">{title}</CardTitle>}
                </div>
              )}
              
              <div className={`flex items-center gap-2 ${!showInfo ? 'ml-auto' : ''}`}>
                {/* Global Search */}
                {searchable && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                )}

                {/* Export Button */}
                {exportable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={!data || data.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}

                {/* Custom Actions */}
                {customActions}
              </div>
            </div>

            {/* Selected Items Info */}
            {selectable && selectedRows.size > 0 && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Đã chọn {selectedRows.size} mục
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRows(new Set())}
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
            )}
          </CardHeader>
        )}

        <CardContent className="p-0">
          {!data || data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      {/* Selection Column */}
                      {selectable && (
                        <th className="px-4 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label="Chọn tất cả"
                            title="Chọn tất cả"
                          />
                        </th>
                      )}

                      {/* Data Columns */}
                      {displayColumns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                            column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                          } ${column.width ? `w-[${column.width}]` : ''}`}
                          onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <div className="flex items-center gap-2">
                            <span>{column.header}</span>
                            {column.sortable && (
                              <div className="flex flex-col">
                                <ChevronUp 
                                  className={`h-3 w-3 ${
                                    sortState.column === column.key && sortState.direction === 'asc'
                                      ? 'text-blue-600' 
                                      : 'text-gray-400'
                                  }`} 
                                />
                                <ChevronDown 
                                  className={`h-3 w-3 -mt-1 ${
                                    sortState.column === column.key && sortState.direction === 'desc'
                                      ? 'text-blue-600' 
                                      : 'text-gray-400'
                                  }`} 
                                />
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.map((row, index) => {
                      const rowId = row.id || row._id || index;
                      const isSelected = selectedRows.has(rowId);
                      
                      return (
                        <tr
                          key={rowId}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          } ${onRowClick ? 'cursor-pointer' : ''}`}
                          onClick={() => onRowClick?.(row)}
                        >
                          {/* Selection Column */}
                          {selectable && (
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectRow(rowId);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                aria-label={`Chọn hàng ${index + 1}`}
                                title={`Chọn hàng ${index + 1}`}
                              />
                            </td>
                          )}

                          {/* Data Columns */}
                          {displayColumns.map((column) => (
                            <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                              {column.render 
                                ? column.render(row[column.key], row, startIndex + index)
                                : row[column.key]
                              }
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Professional Pagination */}
              {totalPages > 1 && (
                <div className="p-2">
                  <ProfessionalPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={processedData.length}
                    itemsPerPage={currentPageSize}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setCurrentPageSize(size);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={pageSizeOptions}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
