import { motion } from 'framer-motion';
import { LucideIcon, Search, Database, Inbox, FileX } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'search' | 'data' | 'empty' | 'error';
  className?: string;
}

const iconMap = {
  search: Search,
  data: Database,
  empty: Inbox,
  error: FileX,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  type = 'empty',
  className = ''
}: EmptyStateProps) {
  const Icon = icon || iconMap[type];
  
  const defaultTitles = {
    search: 'Không tìm thấy kết quả',
    data: 'Chưa có dữ liệu',
    empty: 'Danh sách trống',
    error: 'Có lỗi xảy ra'
  };

  const defaultDescriptions = {
    search: 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn',
    data: 'Dữ liệu sẽ xuất hiện ở đây khi có sẵn',
    empty: 'Hiện tại không có mục nào trong danh sách',
    error: 'Vui lòng thử lại hoặc liên hệ hỗ trợ'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex flex-col items-center justify-center py-12 px-6">
        {/* Icon */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 animate-pulse" />
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full p-6">
              <Icon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title || defaultTitles[type]}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          {description || defaultDescriptions[type]}
        </p>

        {/* Action Button */}
        {action && (
          <Button
            onClick={action.onClick}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>{action.label}</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

