import React from 'react';
import { EnhancedDataTable, EnhancedColumn } from './EnhancedDataTable';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, Edit, Trash2, User, Mail, Phone } from 'lucide-react';

// Sample data for demo
const sampleData = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@email.com',
    phone: '0901234567',
    status: 'active',
    role: 'Customer',
    joinDate: '2024-01-15',
    orders: 12,
    revenue: 2500000
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0902345678',
    status: 'inactive',
    role: 'Customer',
    joinDate: '2024-02-20',
    orders: 8,
    revenue: 1800000
  },
  {
    id: '3',
    name: 'Lê Hoàng Cường',
    email: 'cuong.le@email.com',
    phone: '0903456789',
    status: 'active',
    role: 'Staff',
    joinDate: '2024-01-10',
    orders: 25,
    revenue: 5200000
  },
  {
    id: '4',
    name: 'Phạm Thị Dung',
    email: 'dung.pham@email.com',
    phone: '0904567890',
    status: 'active',
    role: 'Customer',
    joinDate: '2024-03-05',
    orders: 15,
    revenue: 3100000
  },
  {
    id: '5',
    name: 'Hoàng Văn Em',
    email: 'em.hoang@email.com',
    phone: '0905678901',
    status: 'suspended',
    role: 'Customer',
    joinDate: '2024-01-25',
    orders: 3,
    revenue: 650000
  }
];

export function EnhancedDataTableDemo() {
  const handleRowClick = (row: any) => {
    console.log('Row clicked:', row);
  };

  const handleSelectionChange = (selectedRows: any[]) => {
    console.log('Selected rows:', selectedRows);
  };

  const columns: EnhancedColumn[] = [
    {
      key: 'name',
      header: 'Tên người dùng',
      sortable: true,
      filterable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Số điện thoại',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge 
          variant={
            value === 'active' ? 'default' : 
            value === 'inactive' ? 'secondary' : 'destructive'
          }
        >
          {value === 'active' ? 'Hoạt động' : 
           value === 'inactive' ? 'Không hoạt động' : 'Đình chỉ'}
        </Badge>
      ),
      filterFn: (value: string, filterValue: string) => {
        if (filterValue === 'all') return true;
        return value === filterValue;
      }
    },
    {
      key: 'role',
      header: 'Vai trò',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {value === 'Customer' ? 'Khách hàng' : 'Nhân viên'}
        </Badge>
      )
    },
    {
      key: 'orders',
      header: 'Đơn hàng',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      ),
      sortFn: (a: number, b: number) => a - b
    },
    {
      key: 'revenue',
      header: 'Doanh thu',
      sortable: true,
      render: (value: number) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(value)}
        </span>
      ),
      sortFn: (a: number, b: number) => a - b
    },
    {
      key: 'joinDate',
      header: 'Ngày tham gia',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm">
          {new Date(value).toLocaleDateString('vi-VN')}
        </span>
      ),
      sortFn: (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('View:', row);
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit:', row);
            }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete:', row);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Enhanced DataTable Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Showcase các tính năng nâng cao của Enhanced DataTable
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">✨ Tính năng</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
            <li>• Sorting (click header)</li>
            <li>• Global search</li>
            <li>• Row selection</li>
            <li>• Export CSV</li>
          </ul>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100">🔍 Filtering</h3>
          <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
            <li>• Per-column filters</li>
            <li>• Custom filter functions</li>
            <li>• Real-time filtering</li>
          </ul>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">📄 Pagination</h3>
          <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
            <li>• Client-side pagination</li>
            <li>• Configurable page sizes</li>
            <li>• Navigation controls</li>
          </ul>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100">🎨 UI/UX</h3>
          <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
            <li>• Loading states</li>
            <li>• Hover effects</li>
            <li>• Dark mode support</li>
          </ul>
        </div>
      </div>

      <EnhancedDataTable
        title="Demo Enhanced DataTable"
        columns={columns}
        data={sampleData}
        searchable={true}
        exportable={true}
        selectable={true}
        pageSize={3}
        pageSizeOptions={[3, 5, 10]}
        onRowClick={handleRowClick}
        onSelectionChange={handleSelectionChange}
        emptyMessage="Không có dữ liệu demo"
      />
    </div>
  );
}








