import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Activity } from 'lucide-react';
import { AIDashboard } from '@/components/AIDashboard';
import { AIDetailedAnalytics } from '@/components/AIDetailedAnalytics';
import PeakAnalysisSection from '@/components/PeakAnalysisSection';
import StaffPerformanceSection from '@/components/StaffPerformanceSection';

export function Analytics() {

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Page Header - Enhanced AI-focused design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-purple-800 dark:via-blue-800 dark:to-indigo-900 rounded-3xl py-8 px-10 shadow-2xl border-0 overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1 drop-shadow-lg">
                AI Analytics & Insights
              </h1>
              <p className="text-purple-100 dark:text-purple-200 text-lg">
                Phân tích thông minh với AI, dự báo xu hướng và tối ưu hóa hiệu suất
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-semibold text-sm">AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Dashboard - Main Featured Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <AIDashboard />
      </motion.div>

      {/* Divider with Icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center py-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-purple-300 dark:to-purple-700" />
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-full">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-purple-300 dark:to-purple-700" />
        </div>
      </motion.div>

      {/* AI Detailed Analytics - Individual API Sections with Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <AIDetailedAnalytics />
      </motion.div>

      {/* Divider with Icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center py-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-blue-300 dark:to-blue-700" />
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-blue-300 dark:to-blue-700" />
        </div>
      </motion.div>

      {/* Peak Analysis Section - Giờ cao điểm và Ngày cao điểm */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <PeakAnalysisSection />
      </motion.div>

      {/* Divider with Icon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center py-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-px w-32 bg-gradient-to-r from-transparent to-indigo-300 dark:to-indigo-700" />
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="h-px w-32 bg-gradient-to-l from-transparent to-indigo-300 dark:to-indigo-700" />
        </div>
      </motion.div>

      {/* Staff Performance Section - Hiệu suất nhân viên */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <StaffPerformanceSection />
      </motion.div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-6"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Powered by AI · Dữ liệu được cập nhật theo thời gian thực
        </p>
      </motion.div>
    </div>
  );
}