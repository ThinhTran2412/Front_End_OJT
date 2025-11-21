import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({}); // For field error like login, reset password
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email cannot be blank';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format. Please enter a valid email address.';
    }
    return newErrors;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: '' })); // clear email error
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await api.post('/Auth/forgot_password', { EmailForgot: email });
      setSuccess('If the email exists, a reset link has been sent. Please check your inbox.');
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message || err.response?.data?.detail;
      if (status === 404 || status === 400) {
        setErrors({ email: backendMessage || 'Email not found. Please check and try again.' });
      } else {
        setErrors({ email: backendMessage || 'Failed to send reset email. Please try again.' });
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
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-slide-up">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Forgot Password</h1>
            <p className="text-gray-600 text-sm mt-1">Enter your email to receive a reset link</p>
          </div>
          {errors.email && (
            <div className="mb-4 p-3 border rounded-xl text-sm bg-red-50 border-red-200 text-red-700" role="alert" aria-live="assertive">
              {errors.email}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 border rounded-xl text-sm bg-green-50 border-green-200 text-green-700" role="status" aria-live="polite">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${errors.email ? 'border-red-300 bg-red-50 focus:ring-red-500' : ''}`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
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


