'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WiFiGuard from '@/components/WiFiGuard';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aadhaarImage, setAadhaarImage] = useState<string | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [aadhaarMessage, setAadhaarMessage] = useState('');
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }

    const user = JSON.parse(userStr);
    setName(user.name);
    setPhone(user.phone);

    // Fetch Aadhaar status
    fetchAadhaarStatus(user.phone);
  }, [router]);

  const fetchAadhaarStatus = async (userPhone: string) => {
    try {
      const response = await fetch('/api/user/aadhaar/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userPhone }),
      });

      const data = await response.json();

      if (response.ok && data.hasAadhaar) {
        setAadhaarImage('uploaded');
      }
    } catch (err) {
      console.error('Failed to fetch Aadhaar status:', err);
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

          // Max dimensions: 1200x1200
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAadhaarImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setAadhaarMessage('❌ Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      setAadhaarMessage('❌ Image size should not exceed 10MB');
      return;
    }

    setAadhaarMessage('🔄 Compressing image...');

    try {
      // Compress the image
      const compressedBase64 = await compressImage(file);
      
      // Check compressed size
      const compressedSize = (compressedBase64.length * 3) / 4;
      const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
      
      setAadhaarPreview(compressedBase64);
      setAadhaarMessage(`✅ Image compressed to ${compressedSizeMB}MB`);
      setTimeout(() => setAadhaarMessage(''), 2000);
    } catch (error) {
      setAadhaarMessage('❌ Failed to compress image. Please try another image.');
    }
  };

  const handleAadhaarUpload = async () => {
    if (!aadhaarPreview) {
      setAadhaarMessage('❌ Please select an image first');
      return;
    }

    setUploadingAadhaar(true);
    setAadhaarMessage('');
    setShowUploadConfirm(false);

    try {
      const response = await fetch('/api/user/aadhaar/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, aadhaarImage: aadhaarPreview }),
      });

      const data = await response.json();

      if (response.ok) {
        setAadhaarMessage('✅ Aadhaar card uploaded successfully!');
        setAadhaarImage('uploaded');
        setAadhaarPreview(null);
        setTimeout(() => {
          setAadhaarMessage('');
        }, 3000);
      } else {
        setAadhaarMessage('❌ ' + (data.message || 'Failed to upload Aadhaar card'));
      }
    } catch (err) {
      setAadhaarMessage('❌ Failed to connect to server');
    } finally {
      setUploadingAadhaar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('user', JSON.stringify({ name: name.trim(), phone }));
        setMessage('✅ Profile updated successfully!');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setMessage('❌ ' + (data.message || 'Failed to update profile'));
      }
    } catch (err) {
      setMessage('❌ Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WiFiGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-library-blue transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-library-blue to-indigo-600 bg-clip-text text-transparent">
                ✏️ Edit Profile
              </h1>
              <div className="w-16"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-library-blue focus:border-library-blue outline-none text-gray-900 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Phone number cannot be changed
                </p>
              </div>

              {/* Aadhaar Card Upload Section */}
              <div className="border-t-2 border-gray-100 pt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📄 Aadhaar Card Document
                </label>
                
                {aadhaarImage === 'uploaded' ? (
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Aadhaar Card Uploaded</p>
                        <p className="text-xs text-green-600">Your document has been verified</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-library-blue transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAadhaarImageChange}
                        className="hidden"
                        id="aadhaar-upload"
                      />
                      <label htmlFor="aadhaar-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-700">Click to upload Aadhaar Card</p>
                          <p className="text-xs text-gray-500">JPEG, PNG, or WebP (Max 5MB)</p>
                          <p className="text-xs text-amber-600 font-medium mt-1">⚠️ Please upload masked Aadhaar card</p>
                        </div>
                      </label>
                    </div>

                    {aadhaarPreview && (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-300">
                          <img
                            src={aadhaarPreview}
                            alt="Aadhaar preview"
                            className="w-full h-48 object-contain bg-gray-50"
                          />
                          <button
                            onClick={() => {
                              setAadhaarPreview(null);
                              setAadhaarMessage('');
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                            title="Cancel and remove image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setAadhaarPreview(null);
                              setAadhaarMessage('');
                            }}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setShowUploadConfirm(true)}
                            disabled={uploadingAadhaar}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingAadhaar ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </span>
                            ) : (
                              '📤 Confirm & Upload'
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {aadhaarMessage && (
                      <div className={`p-3 rounded-xl font-medium text-sm ${
                        aadhaarMessage.includes('✅')
                          ? 'bg-green-50 border-2 border-green-300 text-green-800'
                          : 'bg-red-50 border-2 border-red-300 text-red-800'
                      }`}>
                        {aadhaarMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {message && (
                <div className={`p-4 rounded-xl font-medium text-sm sm:text-base ${
                  message.includes('✅')
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-800'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-library-blue to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Changes'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Upload Confirmation Modal */}
        {showUploadConfirm && aadhaarPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Upload Aadhaar Card?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Please verify that the Aadhaar card image is <span className="font-semibold text-gray-900">clear and readable</span>.
                <br />
                <span className="text-blue-600 font-medium">You won't be able to change it after uploading.</span>
              </p>
              
              {/* Image preview in modal */}
              <div className="mb-6 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={aadhaarPreview}
                  alt="Aadhaar preview"
                  className="w-full h-32 object-contain bg-gray-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadConfirm(false)}
                  disabled={uploadingAadhaar}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
                >
                  Check Again
                </button>
                <button
                  onClick={handleAadhaarUpload}
                  disabled={uploadingAadhaar}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAadhaar ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : (
                    'Yes, Upload'
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
