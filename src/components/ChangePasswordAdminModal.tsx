import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, X, Lock, Shield } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabase';

interface ChangePasswordAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

const ChangePasswordAdminModal: React.FC<ChangePasswordAdminModalProps> = ({
  isOpen,
  onClose,
  employeeId,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(6, 'Password must be at least 6 characters long')
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const handleSubmit = async (values: { newPassword: string; confirmPassword: string }) => {
    try {
      setIsSubmitting(true);

      // Update the password using Supabase Admin API
      const { error } = await supabaseAdmin.auth.admin.updateUserById(employeeId, {
        password: values.newPassword,
      });

      if (error) {
        throw error;
      }

      alert('Password updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error updating password:', error);
      alert('Failed to update password: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-2xl transition-all border border-gray-200/50">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-semibold text-white"
                        >
                          Change Password
                        </Dialog.Title>
                        <p className="text-purple-100 text-sm mt-0.5">
                          Update employee access credentials
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form content */}
                <div className="px-8 py-6">
                  <Formik
                    initialValues={{
                      newPassword: '',
                      confirmPassword: '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                  >
                    {({ errors, touched }) => (
                      <Form className="space-y-6">
                        {/* New Password Field */}
                        <div>
                          <label
                            htmlFor="newPassword"
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                          >
                            <Lock className="h-4 w-4 text-purple-600" />
                            New Password
                          </label>
                          <div className="relative group">
                            <Field
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              id="newPassword"
                              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-gray-50/50 group-hover:bg-white ${errors.newPassword && touched.newPassword
                                ? 'border-red-400 bg-red-50/50'
                                : 'border-gray-200 hover:border-purple-300'
                                }`}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage
                            name="newPassword"
                            component="div"
                            className="text-red-500 text-sm mt-2 font-medium"
                          />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                          <label
                            htmlFor="confirmPassword"
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
                          >
                            <Lock className="h-4 w-4 text-purple-600" />
                            Confirm New Password
                          </label>
                          <div className="relative group">
                            <Field
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              id="confirmPassword"
                              className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-gray-50/50 group-hover:bg-white ${errors.confirmPassword && touched.confirmPassword
                                ? 'border-red-400 bg-red-50/50'
                                : 'border-gray-200 hover:border-purple-300'
                                }`}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-purple-600 transition-colors duration-200"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <ErrorMessage
                            name="confirmPassword"
                            component="div"
                            className="text-red-500 text-sm mt-2 font-medium"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6">
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Updating...
                              </div>
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

export default ChangePasswordAdminModal;