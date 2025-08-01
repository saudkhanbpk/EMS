import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const validationSchema = Yup.object({
  oldPassword: Yup.string()
    .min(6, 'Old password must be at least 6 characters')
    .required('Old password is required'),
  newPassword: Yup.string()
    .min(6, 'New password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: PasswordFormValues, { setFieldError, setSubmitting }: any) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        toast.error('User not found');
        setSubmitting(false);
        setIsLoading(false);
        return;
      }

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: values.oldPassword,
      });

      if (signInError) {
        // Set field error for old password
        setFieldError('oldPassword', 'Current password is incorrect');
        toast.error('Current password is incorrect');
        setSubmitting(false);
        setIsLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        toast.error('Failed to update password: ' + updateError.message);
        setSubmitting(false);
        setIsLoading(false);
        return;
      }

      toast.success('Password updated successfully');
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('An error occurred while changing password');
      setSubmitting(false);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                        Change Password
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Security notice */}
                <div className="mx-6 mt-6 flex items-start space-x-3 rounded-xl bg-blue-50 p-4">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    For your security, we'll verify your current password before making changes.
                  </p>
                </div>

                <div className="p-6">
                  <Formik
                    initialValues={{
                      oldPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ isSubmitting, errors, touched, setFieldError }) => (
                      <Form className="space-y-5">
                        {/* Old Password Field */}
                        <div>
                          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <Field
                              type={showOldPassword ? 'text' : 'password'}
                              name="oldPassword"
                              id="oldPassword"
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200 ${errors.oldPassword && touched.oldPassword
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                              placeholder="Enter your current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <ErrorMessage name="oldPassword">
                            {msg => (
                              <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle size={14} className="mr-1" />
                                <span className="text-sm">{msg}</span>
                              </div>
                            )}
                          </ErrorMessage>
                        </div>

                        {/* New Password Field */}
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <Field
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              id="newPassword"
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200 ${errors.newPassword && touched.newPassword
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                              placeholder="Create a strong password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <ErrorMessage name="newPassword">
                            {msg => (
                              <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle size={14} className="mr-1" />
                                <span className="text-sm">{msg}</span>
                              </div>
                            )}
                          </ErrorMessage>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Field
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              id="confirmPassword"
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200 ${errors.confirmPassword && touched.confirmPassword
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                              placeholder="Re-enter your new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <ErrorMessage name="confirmPassword">
                            {msg => (
                              <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle size={14} className="mr-1" />
                                <span className="text-sm">{msg}</span>
                              </div>
                            )}
                          </ErrorMessage>
                        </div>

                        {/* Password strength indicator (optional) */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600">Password Requirements:</p>
                          <ul className="text-xs text-gray-500 space-y-1">
                            <li className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                              At least 6 characters long
                            </li>
                            <li className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                              Use a mix of letters, numbers & symbols
                            </li>
                          </ul>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end space-x-3 pt-6">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
                          >
                            {isSubmitting || isLoading ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </span>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ChangePasswordModal;