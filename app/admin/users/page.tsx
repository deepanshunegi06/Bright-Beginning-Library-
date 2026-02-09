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
  hasAadhaar?: boolean;
  aadhaarUploadedAt?: string;
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
  const [viewingAadhaar, setViewingAadhaar] = useState<User | null>(null);
  const [aadhaarImage, setAadhaarImage] = useState<string | null>(null);
  const [loadingAadhaar, setLoadingAadhaar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAadhaar, setDeletingAadhaar] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserJoiningDate, setNewUserJoiningDate] = useState('');
  const [newUserAadhaar, setNewUserAadhaar] = useState<string | null>(null);
  const [newUserAadhaarPreview, setNewUserAadhaarPreview] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'expired' | 'expiring' | 'no-payment'>('all');

  const router = useRouter();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('admin');
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }

    fetchUsers();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchUsers();
    }, 120000);

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
    applyFilters(term, paymentFilter);
  };

  const handlePaymentFilter = (filter: 'all' | 'paid' | 'expired' | 'expiring' | 'no-payment') => {
    setPaymentFilter(filter);
    applyFilters(searchTerm, filter);
  };

  const applyFilters = (term: string, filter: 'all' | 'paid' | 'expired' | 'expiring' | 'no-payment') => {
    let filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(term.toLowerCase()) ||
        u.phone.includes(term)
    );

    if (filter !== 'all') {
      filtered = filtered.filter(u => {
        const paymentStatus = getPaymentStatus(u);
        
        if (filter === 'no-payment') {
          return paymentStatus.status === 'No Payment';
        } else if (filter === 'expired') {
          return paymentStatus.status === 'Expired';
        } else if (filter === 'expiring') {
          return paymentStatus.badge === '🟡'; // Expiring soon
        } else if (filter === 'paid') {
          return paymentStatus.badge === '🟢'; // Active paid
        }
        return true;
      });
    }

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

  const handleViewAadhaar = async (user: User) => {
    if (!user.hasAadhaar) {
      alert('This user has not uploaded an Aadhaar card yet');
      return;
    }

    setViewingAadhaar(user);
    setLoadingAadhaar(true);
    setAadhaarImage(null);

    try {
      const response = await fetch('/api/admin/users/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();

      if (response.ok) {
        setAadhaarImage(data.aadhaarCardImage);
      } else {
        alert(data.message || 'Failed to load Aadhaar card');
        setViewingAadhaar(null);
      }
    } catch (err) {
      alert('Failed to connect to server');
      setViewingAadhaar(null);
    } finally {
      setLoadingAadhaar(false);
    }
  };

  const handleDeleteAadhaar = async () => {
    if (!viewingAadhaar) return;

    setDeletingAadhaar(true);

    try {
      const response = await fetch('/api/admin/users/aadhaar/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: viewingAadhaar._id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Aadhaar card deleted successfully');
        setShowDeleteConfirm(false);
        setViewingAadhaar(null);
        setAadhaarImage(null);
        fetchUsers(); // Refresh the user list
      } else {
        alert(data.message || 'Failed to delete Aadhaar card');
      }
    } catch (err) {
      alert('Failed to connect to server');
    } finally {
      setDeletingAadhaar(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleNewUserAadhaarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setAddUserMessage('❌ Only JPEG, PNG, or WebP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAddUserMessage('❌ File size must be less than 5MB');
      return;
    }

    try {
      const compressed = await compressImage(file);
      setNewUserAadhaar(compressed);
      setNewUserAadhaarPreview(compressed);
      setAddUserMessage('');
    } catch (err) {
      setAddUserMessage('❌ Failed to process image');
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserPhone.trim()) {
      setAddUserMessage('❌ Name and phone are required');
      return;
    }

    if (!/^\d{10}$/.test(newUserPhone.trim())) {
      setAddUserMessage('❌ Phone number must be 10 digits');
      return;
    }

    setAddingUser(true);
    setAddUserMessage('');

    try {
      const response = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          phone: newUserPhone.trim(),
          joiningDate: newUserJoiningDate || undefined,
          aadhaarImage: newUserAadhaar || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddUserMessage('✅ User added successfully!');
        setTimeout(() => {
          setShowAddUserModal(false);
          setNewUserName('');
          setNewUserPhone('');
          setNewUserJoiningDate('');
          setNewUserAadhaar(null);
          setNewUserAadhaarPreview(null);
          setAddUserMessage('');
          fetchUsers();
        }, 1500);
      } else {
        setAddUserMessage('❌ ' + (data.message || 'Failed to add user'));
      }
    } catch (err) {
      setAddUserMessage('❌ Failed to connect to server');
    } finally {
      setAddingUser(false);
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
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 text-sm"
              />
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm whitespace-nowrap"
              >
                ➕ Add User
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 font-medium text-sm"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {/* Payment Status Filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => handlePaymentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => handlePaymentFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentFilter === 'paid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🟢 Paid ({users.filter(u => {
                  const status = getPaymentStatus(u);
                  return status.badge === '🟢';
                }).length})
              </button>
              <button
                onClick={() => handlePaymentFilter('expiring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentFilter === 'expiring'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🟡 Expiring Soon ({users.filter(u => {
                  const status = getPaymentStatus(u);
                  return status.badge === '🟡';
                }).length})
              </button>
              <button
                onClick={() => handlePaymentFilter('expired')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentFilter === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔴 Expired ({users.filter(u => {
                  const status = getPaymentStatus(u);
                  return status.status === 'Expired';
                }).length})
              </button>
              <button
                onClick={() => handlePaymentFilter('no-payment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentFilter === 'no-payment'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚪ No Payment ({users.filter(u => {
                  const status = getPaymentStatus(u);
                  return status.status === 'No Payment';
                }).length})
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
                      Aadhaar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">
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
                            {user.subscriptionExpiryDate ? (
                              new Date(user.subscriptionExpiryDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {user.hasAadhaar ? (
                              <button
                                onClick={() => handleViewAadhaar(user)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Not uploaded</span>
                            )}
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

        {/* Aadhaar Card Viewing Modal */}
        {viewingAadhaar && (
          <div 
            className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setViewingAadhaar(null);
              setAadhaarImage(null);
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">📄 Aadhaar Card Document</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">{viewingAadhaar.name}</span> • {viewingAadhaar.phone}
                  </p>
                  {viewingAadhaar.aadhaarUploadedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded on: {new Date(viewingAadhaar.aadhaarUploadedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setViewingAadhaar(null);
                    setAadhaarImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                {loadingAadhaar ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading Aadhaar card...</p>
                  </div>
                ) : aadhaarImage ? (
                  <img
                    src={aadhaarImage}
                    alt="Aadhaar Card"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">Failed to load Aadhaar card</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setViewingAadhaar(null);
                    setAadhaarImage(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm"
                >
                  Close
                </button>
                {aadhaarImage && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-all font-semibold text-sm"
                  >
                    🗑️ Delete Aadhaar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && viewingAadhaar && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-4">
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Aadhaar Card?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete the Aadhaar card for <span className="font-semibold text-gray-900">{viewingAadhaar.name}</span>?
                <br />
                <span className="text-red-600 font-medium">This action cannot be undone.</span> The student will need to upload it again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAadhaar}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAadhaar}
                  disabled={deletingAadhaar}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingAadhaar ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">➕ Add New User</h2>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserName('');
                    setNewUserPhone('');
                    setNewUserJoiningDate('');
                    setNewUserAadhaar(null);
                    setNewUserAadhaarPreview(null);
                    setAddUserMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Manually add a new student who doesn't have a phone or cannot register online.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter student name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewUserPhone(value);
                    }}
                    placeholder="10 digit phone number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 transition-all"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 10 digits</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Joining Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newUserJoiningDate}
                    onChange={(e) => setNewUserJoiningDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Defaults to today if not specified</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aadhaar Card (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleNewUserAadhaarChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP (max 5MB) - will be compressed</p>
                  {newUserAadhaarPreview && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={newUserAadhaarPreview}
                        alt="Aadhaar Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-green-300"
                      />
                      <button
                        onClick={() => {
                          setNewUserAadhaar(null);
                          setNewUserAadhaarPreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {addUserMessage && (
                  <div className={`p-3 rounded-xl font-medium text-sm ${
                    addUserMessage.includes('✅')
                      ? 'bg-green-50 border-2 border-green-300 text-green-800'
                      : 'bg-red-50 border-2 border-red-300 text-red-800'
                  }`}>
                    {addUserMessage}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserName('');
                    setNewUserPhone('');
                    setNewUserJoiningDate('');
                    setNewUserAadhaar(null);
                    setNewUserAadhaarPreview(null);
                    setAddUserMessage('');
                  }}
                  disabled={addingUser}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingUser ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WiFiGuard>
  );
}
