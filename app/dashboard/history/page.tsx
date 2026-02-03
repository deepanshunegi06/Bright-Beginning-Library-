'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

interface AttendanceRecord {
  date: string;
  inTime: string;
  outTime: string | null;
}

export default function AttendanceHistory() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        router.push('/');
        return;
      }

      const user = JSON.parse(userStr);

      try {
        const response = await fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ phone: user.phone }),
        });

        const data = await response.json();

        if (response.ok) {
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return (
      <WiFiGuard>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-library-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </WiFiGuard>
    );
  }

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-library-blue transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-library-blue to-indigo-600 bg-clip-text text-transparent">
                📊 My History
              </h1>
              <div className="w-16 sm:w-20"></div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            {history.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-6xl sm:text-7xl mb-4">📭</div>
                <p className="text-gray-500 text-base sm:text-lg font-medium">No attendance records yet</p>
                <p className="text-gray-400 text-sm mt-2">Your history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {history.map((record, index) => (
                  <div
                    key={index}
                    className="group bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-base sm:text-lg mb-2">📅 {record.date}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-semibold">IN:</span>
                            <span className="text-gray-700">{record.inTime}</span>
                          </div>
                          <div className="hidden sm:block text-gray-300">|</div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-semibold">OUT:</span>
                            <span className="text-gray-700">{record.outTime || 'Not marked'}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`self-start sm:self-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm ${
                        record.outTime
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                      }`}>
                        {record.outTime ? '✅ Complete' : '⏳ Incomplete'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
