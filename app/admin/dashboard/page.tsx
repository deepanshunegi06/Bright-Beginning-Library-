'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

interface AttendanceRecord {
  _id: string;
  name: string;
  phone: string;
  date: string;
  inTime: string;
  outTime: string | null;
}

interface PaymentAlert {
  _id: string;
  name: string;
  phone: string;
  expiryDate?: string;
  daysLeft?: number;
}

export default function AdminDashboard() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiredUsers, setExpiredUsers] = useState<PaymentAlert[]>([]);
  const [expiringSoonUsers, setExpiringSoonUsers] = useState<PaymentAlert[]>([]);
  const [showPaymentAlerts, setShowPaymentAlerts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin');
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }

    fetchTodayData();
    fetchPaymentAlerts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTodayData();
      fetchPaymentAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/admin/today', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setAttendanceData(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentAlerts = async () => {
    try {
      const response = await fetch('/api/admin/payment-alerts', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setExpiredUsers(data.expired || []);
        setExpiringSoonUsers(data.expiringSoon || []);
      }
    } catch (err) {
      console.error('Failed to fetch payment alerts:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodayData();
    fetchPaymentAlerts();
  };

  const handleForceOut = async (phone: string) => {
    if (!confirm('Are you sure you want to force mark OUT for this student?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/forceOut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        alert('Successfully marked OUT');
        fetchTodayData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to mark OUT');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  const handleDeleteRecord = async (phone: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/deleteRecord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        alert('Record deleted successfully');
        fetchTodayData();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete record');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Phone', 'Date', 'In Time', 'Out Time', 'Status'],
      ...attendanceData.map((record) => [
        record.name,
        record.phone,
        record.date,
        record.inTime,
        record.outTime || 'N/A',
        record.outTime ? 'Left' : 'Inside',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin');
    router.push('/admin/login');
  };

  // Filter and paginate data
  const filteredData = attendanceData.filter(
    (record) =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const insideCount = attendanceData.filter((r) => !r.outTime).length;
  const totalCount = filteredData.length;

  const getCrowdStatus = () => {
    if (insideCount <= 20) return { emoji: '🟢', text: 'Low Crowd', color: 'text-green-600' };
    if (insideCount <= 50) return { emoji: '🟡', text: 'Medium Crowd', color: 'text-yellow-600' };
    return { emoji: '🔴', text: 'High Crowd', color: 'text-red-600' };
  };

  const crowdStatus = getCrowdStatus();

  if (loading) {
    return (
      <WiFiGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </WiFiGuard>
    );
  }

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard - Today</h1>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  👥 Users
                </button>
                <button
                  onClick={() => router.push('/admin/reports')}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  📊 Reports
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all font-medium"
                >
                  🔓 Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Currently Inside</p>
                  <p className="text-3xl font-bold text-gray-800">{insideCount}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg
                    className="w-7 h-7 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Today</p>
                  <p className="text-3xl font-bold text-gray-800">{totalCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg
                    className="w-7 h-7 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-800">{totalCount - insideCount}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className="text-xl font-bold text-gray-800">
                    {crowdStatus.emoji} {crowdStatus.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Alerts */}
          {(expiredUsers.length > 0 || expiringSoonUsers.length > 0) && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Payment Alerts
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {expiredUsers.length > 0 && `${expiredUsers.length} expired`}
                      {expiredUsers.length > 0 && expiringSoonUsers.length > 0 && ', '}
                      {expiringSoonUsers.length > 0 && `${expiringSoonUsers.length} expiring soon`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-sm text-yellow-800 hover:text-yellow-900 font-semibold underline"
                >
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm"
                />
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center font-medium text-sm"
              >
                <svg
                  className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center font-medium text-sm"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      In Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Out Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">
                        {searchTerm ? 'No matching records found' : 'No attendance records for today yet'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {record.phone}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {record.inTime}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {record.outTime || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.outTime
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {record.outTime ? 'Left' : 'Inside'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs space-x-2">
                          {!record.outTime && (
                            <button
                              onClick={() => handleForceOut(record.phone)}
                              className="text-orange-600 hover:text-orange-800 font-semibold"
                            >
                              Force Out
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRecord(record.phone)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between px-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </WiFiGuard>
  );
}
