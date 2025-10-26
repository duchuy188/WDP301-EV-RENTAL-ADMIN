import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

export interface ProfessionalPaginationProps {
  // Dữ liệu phân trang
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Callbacks
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  
  // Tùy chọn
  pageSizeOptions?: number[];
  showGoToPage?: boolean;
  showItemsPerPage?: boolean;
  showTotalItems?: boolean;
  showPageNumbers?: boolean;
  maxPageNumbers?: number; // Số trang tối đa hiển thị trước khi dùng ellipsis
  disabled?: boolean;
  loading?: boolean;
  
  // Văn bản tùy chỉnh
  itemsLabel?: string;
  pageLabel?: string;
  ofLabel?: string;
  goToLabel?: string;
  showingLabel?: string;
  
  // Styling
  className?: string;
  compact?: boolean; // Chế độ gọn cho mobile
}

export const ProfessionalPagination: React.FC<ProfessionalPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  showGoToPage = true,
  showItemsPerPage = true,
  showTotalItems = true,
  showPageNumbers = true,
  maxPageNumbers = 7,
  disabled = false,
  loading = false,
  itemsLabel = 'mục',
  pageLabel = 'Trang',
  ofLabel = 'trên',
  goToLabel = 'Đi tới trang',
  showingLabel = 'Hiển thị',
  className = '',
  compact = false
}) => {
  const [goToPageInput, setGoToPageInput] = useState('');
  const [showGoToInput, setShowGoToInput] = useState(false);

  // Tính toán range hiển thị
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Handler cho page change
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || disabled || loading) {
      return;
    }
    onPageChange(page);
  }, [currentPage, totalPages, disabled, loading, onPageChange]);

  // Handler cho items per page change
  const handleItemsPerPageChange = useCallback((value: number) => {
    if (disabled || loading) return;
    onItemsPerPageChange(value);
  }, [disabled, loading, onItemsPerPageChange]);

  // Handler cho go to page
  const handleGoToPage = useCallback(() => {
    const page = parseInt(goToPageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setGoToPageInput('');
      setShowGoToInput(false);
    }
  }, [goToPageInput, totalPages, handlePageChange]);

  // Tạo danh sách số trang với ellipsis
  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= maxPageNumbers) {
      // Nếu tổng số trang ít, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic phức tạp hơn với ellipsis
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
      
      const shouldShowLeftEllipsis = leftSiblingIndex > 2;
      const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;
      
      // Luôn hiển thị trang đầu
      pages.push(1);
      
      if (shouldShowLeftEllipsis) {
        pages.push('ellipsis');
      }
      
      // Hiển thị các trang xung quanh trang hiện tại
      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (shouldShowRightEllipsis) {
        pages.push('ellipsis');
      }
      
      // Luôn hiển thị trang cuối
      if (totalPages !== 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxPageNumbers]);

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1 && !showItemsPerPage && !showTotalItems) {
    return null; // Không hiển thị pagination nếu chỉ có 1 trang và không có options khác
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Left Section: Items info and per-page selector */}
      <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
        {/* Total items display */}
        {showTotalItems && (
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            {showingLabel} <span className="font-bold text-gray-900 dark:text-white">{startItem}</span>-
            <span className="font-bold text-gray-900 dark:text-white">{endItem}</span> {ofLabel}{' '}
            <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> {itemsLabel}
          </div>
        )}

        {/* Items per page selector */}
        {showItemsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Hiển thị:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              disabled={disabled || loading}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Chọn số mục mỗi trang"
              aria-label="Số mục mỗi trang"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-gray-600 dark:text-gray-400">/ trang</span>
          </div>
        )}
      </div>

      {/* Right Section: Page navigation */}
      <div className="flex items-center gap-2">
        {/* Go to page input */}
        {showGoToPage && !compact && (
          <AnimatePresence>
            {showGoToInput ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2"
              >
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={goToPageInput}
                  onChange={(e) => setGoToPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGoToPage();
                    if (e.key === 'Escape') {
                      setShowGoToInput(false);
                      setGoToPageInput('');
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  className="w-20 h-9 text-center"
                  autoFocus
                  disabled={disabled || loading}
                />
                <Button
                  size="sm"
                  onClick={handleGoToPage}
                  disabled={disabled || loading || !goToPageInput}
                  className="h-9"
                >
                  Đi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowGoToInput(false);
                    setGoToPageInput('');
                  }}
                  className="h-9"
                >
                  ✕
                </Button>
              </motion.div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGoToInput(true)}
                disabled={disabled || loading || totalPages <= 1}
                className="h-9 px-3"
                title={goToLabel}
              >
                {goToLabel}
              </Button>
            )}
          </AnimatePresence>
        )}

        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || disabled || loading}
            className="h-9 w-9 p-0"
            title="Trang đầu"
            aria-label="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled || loading}
            className="h-9 px-3"
            title="Trang trước"
            aria-label="Trang trước"
          >
            {!compact && <ChevronLeft className="h-4 w-4 mr-1" />}
            <span className={compact ? 'sr-only' : ''}>Trước</span>
            {compact && <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Page numbers */}
          {showPageNumbers && !compact && (
            <div className="hidden sm:flex items-center gap-1">
              {pageNumbers.map((pageNum, index) => {
                if (pageNum === 'ellipsis') {
                  return (
                    <div
                      key={`ellipsis-${index}`}
                      className="w-9 h-9 flex items-center justify-center text-gray-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  );
                }

                const isActive = pageNum === currentPage;
                
                return (
                  <motion.div
                    key={pageNum}
                    whileHover={{ scale: isActive ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={disabled || loading}
                      className={`h-9 min-w-[36px] font-medium transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      aria-label={`Trang ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Current page indicator for compact mode */}
          {compact && (
            <div className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              {pageLabel} {currentPage} / {totalPages}
            </div>
          )}

          {/* Next page button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled || loading}
            className="h-9 px-3"
            title="Trang sau"
            aria-label="Trang sau"
          >
            <span className={compact ? 'sr-only' : ''}>Sau</span>
            {!compact && <ChevronRight className="h-4 w-4 ml-1" />}
            {compact && <ChevronRight className="h-4 w-4" />}
          </Button>

          {/* Last page button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || disabled || loading}
            className="h-9 w-9 p-0"
            title="Trang cuối"
            aria-label="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            <span className="hidden sm:inline">Đang tải...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProfessionalPagination;







