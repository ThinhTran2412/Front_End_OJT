import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

export default function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    identifyNumber: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.identifyNumber.trim()) {
      newErrors.identifyNumber = 'Identify Number is required';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    }
    
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onSuccess({
        identifyNumber: formData.identifyNumber.trim(),
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender.trim(),
        phoneNumber: formData.phoneNumber.trim() || '',
        email: formData.email.trim() || '',
        address: formData.address.trim() || ''
      });
      
      // Only reset and close if successful
      if (result) {
        setFormData({
          identifyNumber: '',
          fullName: '',
          dateOfBirth: '',
          gender: '',
          phoneNumber: '',
          email: '',
          address: ''
        });
        setErrors({});
        onClose();
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      
      // Better error handling
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.title ||
                          err.message || 
                          'Failed to add patient. Please try again.';
      
      setError(errorMessage);
      // Don't close modal on error - let user retry
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      identifyNumber: '',
      fullName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      email: '',
      address: ''
    });
    setErrors({});
    setError('');
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear general error
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add New Patient</h2>
                <p className="text-sm text-gray-500">Enter patient's information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Identify Number */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identify Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.identifyNumber}
                  onChange={(e) => handleChange('identifyNumber', e.target.value)}
                  placeholder="e.g., 123456789003"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.identifyNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                  autoFocus
                />
                {errors.identifyNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.identifyNumber}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="e.g., Nguyen Van A"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.dateOfBirth && (
                  <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="e.g., 0123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="e.g., patient@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g., 123 Main Street, City"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}