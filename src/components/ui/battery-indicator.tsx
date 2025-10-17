import { Battery } from 'lucide-react';
import { formatBatteryLevel } from '../service/utils/apiUtils';

interface BatteryIndicatorProps {
  level: number;
  showIcon?: boolean;
  showText?: boolean;
  showBar?: boolean;
  className?: string;
}

export function BatteryIndicator({ 
  level, 
  showIcon = true, 
  showText = true, 
  showBar = true,
  className = ""
}: BatteryIndicatorProps) {
  const batteryInfo = formatBatteryLevel(level);
  
  const getBarColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 50) return 'bg-yellow-500';
    if (level >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <Battery className={`h-4 w-4 ${batteryInfo.color}`} />
      )}
      {showText && (
        <span className={`font-medium ${batteryInfo.color}`}>
          {batteryInfo.text}
        </span>
      )}
      {showBar && (
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getBarColor(level)} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(0, level))}%` }}
          />
        </div>
      )}
    </div>
  );
}
