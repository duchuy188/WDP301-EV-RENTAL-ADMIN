import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  className 
}: KPICardProps) {
  const changeColor = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={cn("", className)}
    >
      <Card className="p-6 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {value}
              </p>
              {change && (
                <p className={cn("text-sm mt-1", changeColor[changeType])}>
                  {change}
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}