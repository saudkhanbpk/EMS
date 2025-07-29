import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, check if the email exists in our users table
      const { data: userExists, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (checkError || !userExists) {
        setError('No account found with this email address. Please check your email or contact support.');
        return;
      }

      // If user exists, proceed with password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://estrowork.vercel.app/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://avatars.mds.yandex.net/i?id=5aee71fcbb31f020b766ad152170c866e737b410-5734461-images-thumbs&n=13')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        </div>

        <div className="relative z-10 max-w-md w-full">
          <div className="bg-[#23272b]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/40 p-8 space-y-8">
            {/* Success Icon */}
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-green-600 to-green-800 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-100">
                  Check your email
                </h2>
                <p className="mt-2 text-gray-300">
                  We've sent a password reset link to <span className="font-medium text-blue-400">{email}</span>
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                Click the link in your email to reset your password. If you don't see the email, check your spam folder.
              </p>
            </div>

            {/* Back to Login */}
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-700/50 hover:bg-gray-700/70 text-gray-200 rounded-xl transition-all duration-200 border border-gray-600/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://avatars.mds.yandex.net/i?id=5aee71fcbb31f020b766ad152170c866e737b410-5734461-images-thumbs&n=13')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-[#23272b]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/40 p-8 space-y-8">
          {/* Logo and Header Section */}
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-100">
                Forgot Password?
              </h2>
              <p className="mt-2 text-gray-300">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-800/80"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 to-gray-900 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative bg-gradient-to-r from-blue-700 to-gray-900 rounded-xl py-3 px-6 text-white font-medium transition-all duration-300 group-hover:bg-opacity-90">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </div>
            </button>

            {/* Back to Login */}
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gray-700/50 hover:bg-gray-700/70 text-gray-200 rounded-xl transition-all duration-200 border border-gray-600/40"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;