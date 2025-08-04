import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResendConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStatus = 'idle' | 'loading' | 'success' | 'error';

const ResendConfirmationModal: React.FC<ResendConfirmationModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ModalStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setEmail('');
    setStatus('idle');
    setError(null);
    onClose();
  };

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setStatus('loading');
      setError(null);

      // Check if user exists and if email is already verified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email_confirmed_at')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new Error('Error checking user status');
      }

      if (userData?.email_confirmed_at) {
        setError('This email is already verified. You can login directly.');
        setStatus('error');
        return;
      }

      // Resend confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (resendError) {
        if (resendError.message.includes('User not found')) {
          setError('No account found with this email address');
        } else {
          throw resendError;
        }
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send confirmation email');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-[#23272b]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/40 w-full max-w-md p-8"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Resend Confirmation</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm mb-4 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {status === 'success' ? (
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-green-900/80 border border-green-700 text-green-200 px-4 py-4 rounded-xl flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                Confirmation email sent successfully! Please check your inbox.
              </div>
              <button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-colors duration-200"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-300 text-sm">
                Enter your email address to receive a new confirmation email.
              </p>

              <form onSubmit={handleResendConfirmation} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Remember your password?{' '}
                  <button
                    onClick={handleClose}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResendConfirmationModal;