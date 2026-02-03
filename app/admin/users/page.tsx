'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

interface User {
  _id: string;
  name: string;
  phone: string;
  joiningDate: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastPaymentMonths?: number;
  subscriptionExpiryDate?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUser, setPaymentUser] = useState<User | null>(null);
  const [paymentMonths, setPaymentMonths] = useState<1 | 3>(1);
  const [paymentDate, setPaymentDate] = useState('');
  const [editPaymentMonths, setEditPaymentMonths] = useState<1 | 3>(1);
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin');
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }

    fetchUsers();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Add cache buster to prevent stale data
      const response = await fetch(`/api/admin/users?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(term.toLowerCase()) ||
        u.phone.includes(term)
    );
    setFilteredUsers(filtered);
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditPaymentMonths((user.lastPaymentMonths === 3 ? 3 : 1) as 1 | 3);
    setEditPaymentDate(user.lastPaymentDate ? new Date(user.lastPaymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/admin/users/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser._id,
          name: editName.trim(),
          phone: editPhone.trim(),
          oldPhone: editingUser.phone
        }),
      });

      if (response.ok) {
        alert('User updated successfully');
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update user');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  const handleSaveEditPayment = async () => {
    if (!editingUser || !editPaymentDate) {
      alert('Please select payment date');
      return;
    }

    try {
      const response = await fetch('/api/admin/payments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser._id,
          phone: editingUser.phone,
          months: editPaymentMonths,
          paymentDate: editPaymentDate
        }),
      });

      if (response.ok) {
        alert('Payment updated successfully');
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update payment');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  const handleAddPayment = (user: User) => {
    setPaymentUser(user);
    setPaymentMonths(1);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (!paymentUser || !paymentDate) {
      alert('Please select payment date');
      return;
    }

    try {
      const response = await fetch('/api/admin/payments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: paymentUser._id,
          phone: paymentUser.phone,
          months: paymentMonths,
          paymentDate: paymentDate
        }),
      });

      if (response.ok) {
        alert('Payment added successfully');
        setShowPaymentModal(false);
        setPaymentUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add payment');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  const getPaymentStatus = (user: User) => {
    if (!user.subscriptionExpiryDate) {
      return { status: 'No Payment', color: 'bg-gray-100 text-gray-700', badge: '⚪' };
    }

    const expiry = new Date(user.subscriptionExpiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800', badge: '🔴' };
    } else if (daysUntilExpiry <= 7) {
      return { status: `${daysUntilExpiry}d left`, color: 'bg-yellow-100 text-yellow-800', badge: '🟡' };
    } else {
      return { status: 'Active', color: 'bg-green-100 text-green-800', badge: '🟢' };
    }
  };

  const handleDeleteUser = async (userId: string, phone: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all their attendance records.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, phone }),
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Failed to connect to server');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-gray-600 hover:text-gray-800 font-semibold text-base"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                  <p className="text-sm text-gray-600">Registered users only</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm"
              />
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 font-medium text-sm"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Registered Users</p>
                <p className="text-4xl font-bold text-gray-800">{filteredUsers.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Users Table */}
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
                      Last Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-medium">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const paymentStatus = getPaymentStatus(user);
                      return (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {user.phone}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'No payment yet'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatus.color}`}>
                              {paymentStatus.badge} {paymentStatus.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-xs space-x-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Edit
                            </button>
                            {!user.lastPaymentDate && (
                              <button
                                onClick={() => handleAddPayment(user)}
                                className="text-green-600 hover:text-green-800 font-semibold"
                              >
                                Add Payment
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user._id, user.phone, user.name)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between px-4 pb-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
              
              {/* Basic Info Section */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm"
                >
                  Save Info
                </button>
              </div>

              {/* Payment Management Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Management</h3>
                
                {editingUser.lastPaymentDate && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Current Status</p>
                    <p className="text-sm font-semibold text-gray-900">
                      Last Payment: {new Date(editingUser.lastPaymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-700">
                      Expires: {editingUser.subscriptionExpiryDate ? new Date(editingUser.subscriptionExpiryDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={editPaymentDate}
                      onChange={(e) => setEditPaymentDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subscription Duration
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditPaymentMonths(1)}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          editPaymentMonths === 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        1 Month
                      </button>
                      <button
                        onClick={() => setEditPaymentMonths(3)}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          editPaymentMonths === 3
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        3 Months
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveEditPayment}
                    className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all font-semibold text-sm"
                  >
                    Update Payment
                  </button>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Add Payment Modal */}
        {showPaymentModal && paymentUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add First Payment</h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Student</p>
                <p className="text-lg font-semibold text-gray-900">{paymentUser.name}</p>
                <p className="text-sm text-gray-600">{paymentUser.phone}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subscription Duration
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMonths(1)}
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        paymentMonths === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      1 Month
                    </button>
                    <button
                      onClick={() => setPaymentMonths(3)}
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        paymentMonths === 3
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      3 Months
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSavePayment}
                  className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all font-semibold text-sm"
                >
                  Add Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentUser(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WiFiGuard>
  );
}
