import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Global error (server)
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({}); // Field errors

  useEffect(() => {
    const t = searchParams.get('token') || '';
    setToken(t);
  }, [searchParams]);

  // Validate function like Login
  const validateForm = () => {
    const newErrors = {};
    if (!password) {
      newErrors.password = 'Password cannot be left blank.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please re-enter your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    return newErrors;
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' })); // Clear also confirm error since they depend on each other
    setError('');
    setSuccess('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Missing or invalid token.');
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post('/Auth/reset_password', { token, newPassword: password });
      setSuccess('Password has been reset successfully. You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message || err.response?.data?.detail;
      const exceptionType = err.response?.data?.ExceptionType;
      if (exceptionType === 'InvalidOrExpiredTokenException') {
        setError('The password reset link has expired or has already been used. Please request a new reset link!');
      } else if (status === 401) {
        setError(backendMessage || 'Invalid or expired token. Please request a new reset link.');
      } else if (status === 404) {
        setError(backendMessage || 'User not found. Please request a new reset link.');
      } else {
        setError(backendMessage || 'Reset failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")`
        }}></div>
      </div>
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-blue-400 rounded-full opacity-25 animate-pulse"></div>
      {/* Main Content - Centered Card */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-slide-up">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Reset Password</h1>
            <p className="text-gray-600 text-sm mt-1">Enter a new password for your account</p>
          </div>
          {error && (
            <div className="mb-4 p-3 border rounded-xl text-sm bg-red-50 border-red-200 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 border rounded-xl text-sm bg-green-50 border-green-200 text-green-700">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${errors.password ? 'border-red-300 bg-red-50 focus:ring-red-500' : ''}`}
              />
              {errors.password && <span className="text-xs text-red-600 mt-1 inline-block animate-fade-in">{errors.password}</span>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${errors.confirmPassword ? 'border-red-300 bg-red-50 focus:ring-red-500' : ''}`}
              />
              {errors.confirmPassword && <span className="text-xs text-red-600 mt-1 inline-block animate-fade-in">{errors.confirmPassword}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <a href="/login" className="text-blue-600 hover:text-blue-800 hover:underline">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}


