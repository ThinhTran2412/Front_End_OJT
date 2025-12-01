import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

// Toast Component
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  };

  return (
    <div className={`flex items-center gap-3 ${bgColors[type]} border rounded-lg p-4 shadow-lg min-w-[320px] max-w-md animate-slide-in`}>
      {icons[type]}
      <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Custom Hook for Toast
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, showToast, removeToast };
}

// Demo Component
export default function ToastDemo() {
  const { toasts, showToast, removeToast } = useToast();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Toast Notification Demo</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Try different toast types:</h2>
          
          <button
            onClick={() => showToast('Test order created successfully!', 'success')}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Show Success Toast
          </button>
          
          <button
            onClick={() => showToast('Failed to create test order. Please try again.', 'error')}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Show Error Toast
          </button>
          
          <button
            onClick={() => showToast('Test order is being processed...', 'info')}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Show Info Toast
          </button>

          <button
            onClick={() => {
              showToast('Test order created successfully! Order ID: ORD-12345', 'success');
              setTimeout(() => showToast('Test results are ready to view', 'info'), 500);
            }}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Show Multiple Toasts
          </button>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Usage Example:</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`import { useToast, ToastContainer } from './Toast';

function YourComponent() {
  const { toasts, showToast, removeToast } = useToast();

  const handleSubmit = async () => {
    try {
      // Your API call
      showToast('Operation successful!', 'success');
    } catch (error) {
      showToast('Operation failed!', 'error');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Your component content */}
    </>
  );
}`}
          </pre>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}