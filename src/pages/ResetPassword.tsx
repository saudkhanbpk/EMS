import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const isConfirmFocusedRef = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL parameters for tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Try to get token from multiple sources
        const accessToken = hashParams.get('access_token') ||
          queryParams.get('access_token') ||
          queryParams.get('token'); // Also check for 'token' parameter

        const type = hashParams.get('type') || queryParams.get('type');

        console.log('Token search:', {
          hashToken: hashParams.get('access_token'),
          queryToken: queryParams.get('token'),
          accessToken: !!accessToken,
          type
        });

        if (type === 'recovery' && accessToken) {
          // Exchange the recovery token for a session
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: accessToken,
            type: 'recovery'
          });

          if (error) {
            console.error('Failed to verify OTP:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
            return;
          }

          console.log('Recovery session established');
          return;
        }

        // If no token found
        if (!accessToken) {
          setError('Invalid reset link. Please request a new password reset.');
          return;
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    handleAuthCallback();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resetting password');
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
                  Password Reset Successful
                </h2>
                <p className="mt-2 text-gray-300">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </p>
              </div>
            </div>

            {/* Loading indicator */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
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
                Reset Password
              </h2>
              <p className="mt-2 text-gray-300">
                Enter your new password below
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              {/* New Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    required
                    value={password}
                    ref={passwordRef}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => {
                      isFocusedRef.current = true;
                    }}
                    onBlur={() => {
                      isFocusedRef.current = false;
                    }}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-800/80"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!isFocusedRef.current && passwordRef.current) {
                        passwordRef.current.focus();
                      }
                      setPasswordVisible(!passwordVisible);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {passwordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    ref={confirmPasswordRef}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => {
                      isConfirmFocusedRef.current = true;
                    }}
                    onBlur={() => {
                      isConfirmFocusedRef.current = false;
                    }}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-800/80"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!isConfirmFocusedRef.current && confirmPasswordRef.current) {
                        confirmPasswordRef.current.focus();
                      }
                      setConfirmPasswordVisible(!confirmPasswordVisible);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {confirmPasswordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4">
              <p className="text-blue-200 text-sm font-medium mb-2">Password Requirements:</p>
              <ul className="text-blue-200 text-xs space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
              </ul>
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
                    Updating password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;