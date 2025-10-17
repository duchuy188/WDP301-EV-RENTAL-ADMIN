import React from 'react';
import { Check } from 'lucide-react';

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

// Định nghĩa các màu phổ biến cho xe điện
const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Trắng', value: 'Trắng', hex: '#FFFFFF' },
  { name: 'Đen', value: 'Đen', hex: '#000000' },
  { name: 'Xám', value: 'Xám', hex: '#6B7280' },
  { name: 'Bạc', value: 'Bạc', hex: '#C0C0C0' },
  { name: 'Đỏ', value: 'Đỏ', hex: '#EF4444' },
  { name: 'Xanh dương', value: 'Xanh dương', hex: '#3B82F6' },
  { name: 'Xanh lá', value: 'Xanh lá', hex: '#10B981' },
  { name: 'Vàng', value: 'Vàng', hex: '#F59E0B' },
  { name: 'Cam', value: 'Cam', hex: '#F97316' },
  { name: 'Tím', value: 'Tím', hex: '#8B5CF6' },
  { name: 'Hồng', value: 'Hồng', hex: '#EC4899' },
  { name: 'Nâu', value: 'Nâu', hex: '#92400E' },
  { name: 'Xanh navy', value: 'Xanh navy', hex: '#1E40AF' },
  { name: 'Xanh mint', value: 'Xanh mint', hex: '#06B6D4' },
  { name: 'Vàng chanh', value: 'Vàng chanh', hex: '#84CC16' },
  { name: 'Đỏ đô', value: 'Đỏ đô', hex: '#DC2626' }
];

// Function to get Tailwind color class from hex
function getColorClass(hex: string): string {
  const colorMap: { [key: string]: string } = {
    '#FFFFFF': 'bg-white',
    '#000000': 'bg-black',
    '#6B7280': 'bg-gray-500',
    '#C0C0C0': 'bg-gray-300',
    '#EF4444': 'bg-red-500',
    '#3B82F6': 'bg-blue-500',
    '#10B981': 'bg-emerald-500',
    '#F59E0B': 'bg-amber-500',
    '#F97316': 'bg-orange-500',
    '#8B5CF6': 'bg-violet-500',
    '#EC4899': 'bg-pink-500',
    '#92400E': 'bg-amber-800',
    '#1E40AF': 'bg-blue-800',
    '#06B6D4': 'bg-cyan-500',
    '#84CC16': 'bg-lime-500',
    '#DC2626': 'bg-red-600'
  };
  return colorMap[hex] || 'bg-gray-500';
}

export function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-8 gap-2">
        {COLOR_OPTIONS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={`
              relative w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              ${value === color.value 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${getColorClass(color.hex)}
            `}
            title={color.name}
            aria-label={`Chọn màu ${color.name}`}
          >
            {value === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check 
                  className={`h-4 w-4 ${
                    color.hex === '#FFFFFF' || color.hex === '#F59E0B' || color.hex === '#84CC16' 
                      ? 'text-gray-800' 
                      : 'text-white'
                  }`} 
                />
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Hiển thị màu đã chọn */}
      {value && (
        <div className="flex items-center space-x-2 mt-2">
          <div 
            className={`w-4 h-4 rounded border border-gray-300 ${
              getColorClass(COLOR_OPTIONS.find(c => c.value === value)?.hex || '#6B7280')
            }`}
          />
          <span className="text-sm text-gray-700">Đã chọn: {value}</span>
        </div>
      )}
      
      {/* Input tùy chỉnh cho màu khác */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1">
          Hoặc nhập màu khác:
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="VD: Xanh lục bảo, Đỏ cherry..."
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
