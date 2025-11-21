import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';

export default function TestOrderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  mode = 'create',
  initialData = null,
  patientData = null
}) {
  const [formData, setFormData] = useState({
    identifyNumber: '',
    patientName: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',
    address: '',
    phoneNumber: '',
    email: '',
    priority: 'Normal',
    note: '',
    servicePackageId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const priorities = ['Normal', 'Urgent', 'STAT'];
  const genders = ['Male', 'Female', 'Other'];
  
  // Service packages with real GUIDs
  const servicePackages = [
    { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Complete Blood Count (CBC)' },
    { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Lipid Panel' },
    { id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', name: 'Comprehensive Metabolic Panel' },
    { id: '6fa85f64-5717-4562-b3fc-2c963f66afa9', name: 'Thyroid Function Test' },
    { id: '7fa85f64-5717-4562-b3fc-2c963f66afaa', name: 'Liver Function Test' },
    { id: '8fa85f64-5717-4562-b3fc-2c963f66afab', name: 'Renal Function Test' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          identifyNumber: initialData.identifyNumber || '',
          patientName: initialData.patientName || '',
          dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
          age: String(initialData.age || ''),
          gender: initialData.gender || 'Male',
          address: initialData.address || '',
          phoneNumber: initialData.phoneNumber || '',
          email: initialData.email || '',
          priority: initialData.priority || 'Normal',
          note: initialData.note || '',
          servicePackageId: initialData.servicePackageId || ''
        });
      } else if (mode === 'create' && patientData) {
        setFormData({
          identifyNumber: patientData.identifyNumber || '',
          patientName: patientData.fullName || '',
          dateOfBirth: patientData.dateOfBirth ? patientData.dateOfBirth.split('T')[0] : '',
          age: String(patientData.age || ''),
          gender: patientData.gender || 'Male',
          address: patientData.address || '',
          phoneNumber: patientData.phoneNumber || '',
          email: patientData.email || '',
          priority: 'Normal',
          note: '',
          servicePackageId: servicePackages[0]?.id || ''
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, initialData, patientData]);

  const validateForm = () => {
    const newErrors = {};
    
    // Common validations for both CREATE and EDIT modes
    if (!formData.identifyNumber.trim()) {
      newErrors.identifyNumber = 'Identify Number is required';
    }
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient Name is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    // For CREATE mode, validate servicePackageId
    if (mode === 'create') {
      if (!formData.servicePackageId) {
        newErrors.servicePackageId = 'Service Package is required';
      }
    }
    
    // For EDIT mode, validate age
    if (mode === 'edit') {
      const ageNum = parseInt(formData.age);
      if (!formData.age || isNaN(ageNum) || ageNum <= 0) {
        newErrors.age = 'Valid age is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let submitData;
      
      if (mode === 'create') {
        // CREATE: all patient info + testType (servicePackageId) + priority + note
        submitData = {
          identifyNumber: formData.identifyNumber.trim(),
          fullName: formData.patientName.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          testType: formData.servicePackageId, // Map servicePackageId to testType
          priority: formData.priority,
          note: formData.note.trim()
        };
      } else {
        // EDIT: full patient info + priority + note + status
        submitData = {
          identifyNumber: formData.identifyNumber.trim(),
          patientName: formData.patientName.trim(),
          dateOfBirth: formData.dateOfBirth,
          age: parseInt(formData.age),
          gender: formData.gender,
          address: formData.address.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          priority: formData.priority,
          note: formData.note.trim(),
          status: initialData?.status || 'Created'
        };
      }

      console.log(`${mode.toUpperCase()} payload:`, submitData);
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
      setErrors({ 
        submit: error.response?.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.response?.data?.message || error.message || 'Failed to submit test order'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to delete test order' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'create' ? 'Create New Test Order' : 'Edit Test Order'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'edit' ? `Order ID: ${initialData?.testOrderId}` : 'Fill in the information below'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Patient Information Section - Show for both CREATE and EDIT modes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identify Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="identifyNumber"
                      value={formData.identifyNumber}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.identifyNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 079203004567"
                    />
                    {errors.identifyNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.identifyNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.patientName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter patient name"
                    />
                    {errors.patientName && (
                      <p className="text-sm text-red-600 mt-1">{errors.patientName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {genders.map(gender => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 0909123456"
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full address"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Service Package - Only for CREATE */}
                  {mode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Type (Service Package) <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="servicePackageId"
                        value={formData.servicePackageId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.servicePackageId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a service package</option>
                        {servicePackages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </option>
                        ))}
                      </select>
                      {errors.servicePackageId && (
                        <p className="text-sm text-red-600 mt-1">{errors.servicePackageId}</p>
                      )}
                    </div>
                  )}

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      {priorities.map(priority => (
                        <label key={priority} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={priority}
                            checked={formData.priority === priority}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          <span className={`text-sm font-medium ${
                            priority === 'STAT' ? 'text-red-600' :
                            priority === 'Urgent' ? 'text-orange-600' :
                            'text-gray-700'
                          }`}>
                            {priority}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any additional notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : mode === 'create' ? 'Create Order' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Test Order</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this test order? All associated data will be permanently removed.
              </p>
              
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}