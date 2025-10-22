import React from 'react';
import { motion } from 'framer-motion';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any, index?: number) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[] | undefined;
  loading?: boolean;
}

export function DataTable({ title, columns, data, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="w-full">
        {title && (
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                {columns.map((_, j) => (
                  <div key={j} className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Không có dữ liệu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {title && (
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="w-full">
        <table className="w-full min-w-full table-auto">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {(data || []).map((row, index) => (
              <tr 
                key={row.id || row._id || index} 
                className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {column.render 
                      ? column.render(row[column.key], row, index)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}