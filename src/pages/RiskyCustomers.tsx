import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, Loader2, Eye } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserService } from '../components/service/userService';
import { User as UserType, UsersParams } from '../components/service/type/userTypes';

export default function RiskyCustomers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [filters, setFilters] = useState<UsersParams>({ page: 1, limit: 10 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRisky = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await UserService.getRiskyCustomers({
          page: filters.page,
          limit: filters.limit,
          search: searchQuery || undefined,
        });
        console.log('🔍 RiskyCustomers API Response:', res);
        setUsers(res.users || []);
        setPagination(res.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRisky();
  }, [filters, searchQuery]);

  const handleSearch = () => setFilters(prev => ({ ...prev, page: 1 }));

  const columns = [
    { key: 'fullname', header: 'Tên khách hàng' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Số điện thoại' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : 'destructive'}>
          {value === 'active' ? 'Hoạt động' : 'Bị chặn'}
        </Badge>
      )
    },
    {
      key: 'risk',
      header: 'Mức độ rủi ro',
      render: () => (
        <Badge variant="destructive">Rủi ro</Badge>
      )
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          Khách hàng rủi ro
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Theo dõi khách hàng có hành vi rủi ro</p>
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="text-red-700 dark:text-red-300">{error}</div>
        </div>
      ) : (
        <DataTable title="Danh sách khách hàng rủi ro" columns={columns} data={users} />
      )}
    </div>
  );
}



