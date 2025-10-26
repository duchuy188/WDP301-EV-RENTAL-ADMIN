# Professional Pagination Component

Component phân trang chuyên nghiệp với đầy đủ tính năng cho ứng dụng EV Rental Admin.

## ✨ Tính năng

### 🧩 Thành phần cơ bản
- ✅ **Previous/Next buttons** - Di chuyển trang trước/sau
- ✅ **First/Last buttons** - Nhảy đến trang đầu/cuối
- ✅ **Số trang với ellipsis** - Hiển thị thông minh khi có nhiều trang (1 ... 5 6 7 8 ... 20)
- ✅ **Active page highlighting** - Đánh dấu trang hiện tại nổi bật
- ✅ **Responsive design** - Tự động điều chỉnh trên mobile (compact mode)

### ⚙️ Thành phần nâng cao
- ✅ **Go to page input** - Nhập số trang để nhảy nhanh
- ✅ **Items per page selector** - Dropdown chọn số bản ghi/trang
- ✅ **Tổng số bản ghi** - Hiển thị "Hiển thị 1-10 trên 253 kết quả"
- ✅ **Loading state** - Hiển thị trạng thái đang tải
- ✅ **Disabled state** - Vô hiệu hóa khi đang xử lý

### 🎨 UX/UI chuyên nghiệp
- ✅ Smooth transitions với Framer Motion
- ✅ Hover/Active effects
- ✅ Dark mode support
- ✅ Accessibility (ARIA labels)
- ✅ Keyboard navigation
- ✅ Mobile responsive

## 📦 Cài đặt

Component đã được tích hợp sẵn tại: `src/components/ui/professional-pagination.tsx`

## 🚀 Cách sử dụng

### Import component

```tsx
import { ProfessionalPagination } from '../components/ui/professional-pagination';
```

### Sử dụng cơ bản

```tsx
<ProfessionalPagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={(page) => setCurrentPage(page)}
  onItemsPerPageChange={(size) => setItemsPerPage(size)}
/>
```

### Sử dụng đầy đủ với tùy chọn

```tsx
<ProfessionalPagination
  // Dữ liệu phân trang (bắt buộc)
  currentPage={pagination.page}
  totalPages={pagination.pages}
  totalItems={pagination.total}
  itemsPerPage={pagination.limit}
  
  // Callbacks (bắt buộc)
  onPageChange={(page) => handlePageChange(page)}
  onItemsPerPageChange={(size) => handleSizeChange(size)}
  
  // Tùy chọn
  pageSizeOptions={[10, 25, 50, 100]}
  showGoToPage={true}
  showItemsPerPage={true}
  showTotalItems={true}
  showPageNumbers={true}
  maxPageNumbers={7}
  loading={loading}
  disabled={false}
  
  // Văn bản tùy chỉnh
  itemsLabel="khách hàng"
  pageLabel="Trang"
  ofLabel="trên"
  goToLabel="Đi tới trang"
  showingLabel="Hiển thị"
  
  // Styling
  className="mt-6"
  compact={false}
/>
```

## 📋 Props

| Prop | Type | Mặc định | Mô tả |
|------|------|----------|-------|
| `currentPage` | `number` | - | **Bắt buộc**. Trang hiện tại (1-based) |
| `totalPages` | `number` | - | **Bắt buộc**. Tổng số trang |
| `totalItems` | `number` | - | **Bắt buộc**. Tổng số bản ghi |
| `itemsPerPage` | `number` | - | **Bắt buộc**. Số bản ghi mỗi trang |
| `onPageChange` | `(page: number) => void` | - | **Bắt buộc**. Callback khi đổi trang |
| `onItemsPerPageChange` | `(size: number) => void` | - | **Bắt buộc**. Callback khi đổi số bản ghi/trang |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Các tùy chọn số bản ghi/trang |
| `showGoToPage` | `boolean` | `true` | Hiển thị input "Đi tới trang" |
| `showItemsPerPage` | `boolean` | `true` | Hiển thị selector số bản ghi/trang |
| `showTotalItems` | `boolean` | `true` | Hiển thị tổng số bản ghi |
| `showPageNumbers` | `boolean` | `true` | Hiển thị các số trang |
| `maxPageNumbers` | `number` | `7` | Số trang tối đa hiển thị trước khi dùng ellipsis |
| `disabled` | `boolean` | `false` | Vô hiệu hóa toàn bộ pagination |
| `loading` | `boolean` | `false` | Hiển thị trạng thái đang tải |
| `itemsLabel` | `string` | `'mục'` | Nhãn cho đơn vị bản ghi |
| `pageLabel` | `string` | `'Trang'` | Nhãn "Trang" |
| `ofLabel` | `string` | `'trên'` | Nhãn "trên" |
| `goToLabel` | `string` | `'Đi tới trang'` | Nhãn nút "Đi tới trang" |
| `showingLabel` | `string` | `'Hiển thị'` | Nhãn "Hiển thị" |
| `className` | `string` | `''` | CSS class tùy chỉnh |
| `compact` | `boolean` | `false` | Chế độ gọn cho mobile |

## 🎯 Ví dụ thực tế

### 1. Server-side pagination (với API)

```tsx
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
});

// Fetch data từ API
useEffect(() => {
  fetchData(pagination.page, pagination.limit);
}, [pagination.page, pagination.limit]);

// Render pagination
<ProfessionalPagination
  currentPage={pagination.page}
  totalPages={pagination.pages}
  totalItems={pagination.total}
  itemsPerPage={pagination.limit}
  onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
  onItemsPerPageChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
  itemsLabel="khách hàng"
/>
```

### 2. Client-side pagination (với dữ liệu local)

```tsx
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

// Tính toán
const totalPages = Math.ceil(filteredData.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

// Reset về trang 1 khi filter thay đổi
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filters]);

// Render pagination
<ProfessionalPagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={filteredData.length}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={(size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }}
  itemsLabel="trạm"
/>
```

## 🌍 Các trang đã áp dụng

Component này đã được áp dụng cho tất cả các trang quản lý:

1. ✅ **Customers** (`src/pages/Customers.tsx`) - Server-side pagination
2. ✅ **Staff** (`src/pages/Staff.tsx`) - Server-side pagination  
3. ✅ **Stations** (`src/pages/Stations.tsx`) - Client-side pagination
4. ✅ **Fleet** (`src/pages/Fleet.tsx`) - Qua EnhancedDataTable
5. ✅ **Payments** (`src/pages/Payments.tsx`) - Server-side pagination
6. ✅ **Feedback** (`src/pages/Feedback.tsx`) - Qua EnhancedDataTable
7. ✅ **Assignment** (`src/pages/Assignment.tsx`) - Server-side pagination
8. ✅ **RiskyCustomers** (`src/pages/RiskyCustomers.tsx`) - Server-side pagination

## 🎨 Customization

### Tùy chỉnh màu sắc

Component sử dụng Tailwind CSS và tự động hỗ trợ dark mode. Bạn có thể tùy chỉnh thêm bằng className:

```tsx
<ProfessionalPagination
  className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg"
  {...props}
/>
```

### Tùy chỉnh văn bản

```tsx
<ProfessionalPagination
  itemsLabel="sản phẩm"
  pageLabel="Page"
  ofLabel="of"
  goToLabel="Go to page"
  showingLabel="Showing"
  {...props}
/>
```

### Responsive behavior

Component tự động responsive:
- Desktop: Hiển thị đầy đủ số trang, go-to input, tất cả controls
- Mobile: Chế độ compact với ít controls hơn, tối ưu cho màn hình nhỏ

Bạn có thể force compact mode:

```tsx
<ProfessionalPagination
  compact={true}
  {...props}
/>
```

## 🔧 Tính năng đặc biệt

### 1. Ellipsis thông minh

Khi có nhiều trang, component tự động hiển thị ellipsis:
- `1 2 3 4 5 6 7` (≤7 trang)
- `1 ... 5 6 7 ... 20` (>7 trang, đang ở giữa)
- `1 2 3 ... 20` (Ở đầu)
- `1 ... 18 19 20` (Ở cuối)

### 2. Go to page với validation

- Chỉ chấp nhận số trong khoảng hợp lệ
- Enter để submit
- Escape để đóng
- Tự động focus khi mở

### 3. Loading state

Khi `loading={true}`:
- Disable tất cả controls
- Hiển thị spinner
- Ngăn click spam

### 4. Keyboard shortcuts

- **Arrow keys**: Di chuyển trong input
- **Enter**: Submit go-to-page
- **Escape**: Đóng go-to-page input
- **Tab**: Di chuyển giữa các controls

## 🐛 Troubleshooting

### Pagination không hiển thị

- Kiểm tra `totalPages > 1`
- Đảm bảo tất cả props bắt buộc được truyền vào

### Số trang không đúng

- Kiểm tra công thức: `totalPages = Math.ceil(totalItems / itemsPerPage)`
- Đảm bảo `totalItems` và `itemsPerPage` đúng

### Không reset về trang 1 khi filter

Thêm useEffect:

```tsx
useEffect(() => {
  setCurrentPage(1); // hoặc onPageChange(1)
}, [searchTerm, filters]);
```

## 📚 Dependencies

- `framer-motion` - Animations
- `lucide-react` - Icons
- `./button`, `./input` - UI components
- Tailwind CSS - Styling

## 🎉 Kết luận

Component `ProfessionalPagination` cung cấp một giải pháp phân trang hoàn chỉnh, chuyên nghiệp với:
- ✨ UI/UX đẹp mắt, hiện đại
- 🚀 Performance tốt
- ♿ Accessibility đầy đủ
- 📱 Responsive hoàn hảo
- 🎨 Dễ dàng tùy chỉnh
- 💪 Type-safe với TypeScript

---

Được phát triển cho **WDP301 EV Rental Admin System** 🚗⚡







