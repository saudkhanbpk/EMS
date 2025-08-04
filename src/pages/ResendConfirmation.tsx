import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Clock, Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ResendConfirmation: React.FC = () => {
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

      // First, try to resend the confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (resendError) {
        // Parse error messages more carefully
        const errorMessage = resendError.message.toLowerCase();

        // Check for various "not found" patterns
        if (
          errorMessage.includes('user not found') ||
          errorMessage.includes('no user found') ||
          errorMessage.includes('cannot resend') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('not registered')
        ) {
          setError('No account found with this email address. Please sign up first.');
        }
        // Check for already confirmed patterns
        else if (
          errorMessage.includes('already confirmed') ||
          errorMessage.includes('already verified') ||
          errorMessage.includes('email already confirmed')
        ) {
          setError('This email is already verified. You can login directly.');
        }
        // Check for rate limit
        else if (
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests')
        ) {
          setError('Too many attempts. Please wait a few minutes before trying again.');
        }
        // Default error
        else {
          // For debugging, you might want to see the actual error
          console.error('Resend error:', resendError);
          setError('Unable to resend confirmation email. Please try again later.');
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send confirmation email');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-[#23272b]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/40 p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-100">
                Resend Confirmation
              </h2>
              <p className="mt-2 text-gray-300">
                Enter your email to receive a new confirmation link
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success ? (
            <div className="text-center space-y-6">
              <div className="bg-green-900/80 border border-green-700 text-green-200 px-4 py-4 rounded-xl flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                Confirmation email sent! Please check your inbox and spam folder.
              </div>
              <div className="text-gray-300 text-sm">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          ) : (
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
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Confirmation Email'
                )}
              </button>

              {/* Links */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center text-gray-300 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </button>

                <div className="text-center text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResendConfirmation;