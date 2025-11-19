import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  bgColor?: string;
  textColor?: string;
  delay?: number;
}

export function AnimatedStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradientFrom,
  gradientTo,
  bgColor = 'bg-white',
  textColor = 'text-gray-900',
  delay = 0
}: AnimatedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ delay, duration: 0.2 }}
      className={`${bgColor} dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl cursor-pointer transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${textColor} dark:text-white`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: 0, scale: 1 }}
          whileHover={{
            rotate: [0, -16, 16, -16, 16, 0],
            scale: 1.1
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg`}
        >
          <Icon className="text-white" size={26} />
        </motion.div>
      </div>
    </motion.div>
  );
}
