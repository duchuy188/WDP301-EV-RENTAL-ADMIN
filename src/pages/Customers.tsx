import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, Calendar } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';

export function Customers() {
  const customers = storage.getCustomers();

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'name',
      header: 'Tên khách hàng',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'license',
      header: 'GPLX',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <span className="font-mono">{value}</span>
        </div>
      )
    },
    {
      key: 'riskLevel',
      header: 'Mức độ rủi ro',
      render: (value: string) => (
        <Badge variant={value === 'normal' ? 'success' : 'destructive'}>
          {value === 'normal' ? 'Bình thường' : 'Có rủi ro'}
        </Badge>
      )
    },
    {
      key: 'totalRentals',
      header: 'Số lần thuê',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'joinDate',
      header: 'Ngày tham gia',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{new Date(value).toLocaleDateString('vi-VN')}</span>
        </div>
      )
    }
  ];

  const totalCustomers = customers.length;
  const normalCustomers = customers.filter(c => c.riskLevel === 'normal').length;
  const riskyCustomers = customers.filter(c => c.riskLevel === 'risky').length;

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý khách hàng
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý thông tin và theo dõi hoạt động của khách hàng
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Tổng khách hàng
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {totalCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                KH bình thường
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                {normalCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                KH có rủi ro
              </p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                {riskyCustomers}
              </p>
            </div>
            <User className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Customer Table */}
      <DataTable
        title="Danh sách khách hàng"
        columns={columns}
        data={customers}
      />
    </div>
  );
}