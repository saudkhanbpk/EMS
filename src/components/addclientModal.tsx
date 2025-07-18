import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { supabaseAdmin } from '../lib/supabase';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientAdded?: () => void;
}

const validationSchema = Yup.object({
    fullName: Yup.string().min(3, 'Full name must be at least 3 characters').required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    personalEmail: Yup.string().email('Invalid personal email').required('Personal email is required'),
});

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { userProfile } = useUser();

    const initialValues = {
        fullName: '',
        phone: '',
        email: '',
        personalEmail: '',
        location: '',
        slackId: '',
        joiningDate: '',
        password: '',
        profileImage: undefined as File | undefined,
    };
    
    // Reset all state variables when modal is closed
    const handleClose = () => {
        setShowPassword(false);
        setIsLoading(false);
        setInviteLoading(false);
        setError(null);
        setValidationError(null);
        setSuccessMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    const handleSubmit = async (values: typeof initialValues) => {
        setIsLoading(true);
        setError(null);
        setValidationError(null);

        try {
            // Create user with supabaseAdmin
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
                email: values.email,
                password: values.password,
                email_confirm: true
            });

            if (userError) throw userError;

            if (userData.user) {
                // Update user details in the users table
                const { error: updateError } = await supabaseAdmin
                    .from('users')
                    .update({
                        role: 'client',
                        full_name: values.fullName,
                        slack_id: values.slackId,
                        personal_email: values.personalEmail,
                        phone_number: values.phone,
                        location: values.location,
                        joining_date: values.joiningDate,
                        organization_id: userProfile?.organization_id,
                    })
                    .eq('id', userData.user.id);

                if (updateError) throw updateError;

                // Call the callback to refetch clients
                if (onClientAdded) {
                    onClientAdded();
                }

                handleClose();
            }
        } catch (error) {
            console.error('Error creating client:', error);
            setError(error instanceof Error ? error.message : 'Failed to create client');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl w-full max-w-2xl p-8 relative">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    onClick={handleClose}
                >
                    <FiX size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Client Details</h2>
                <div className="h-1 w-full bg-purple-500 mb-6" />
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ setFieldValue, errors, touched, values, validateForm }) => (
                        <Form>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1">Full Name</label>
                                    <Field
                                        type="text"
                                        name="fullName"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.fullName && touched.fullName ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="fullName" component="div" className="text-red-500 text-xs mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Phone</label>
                                    <Field
                                        type="text"
                                        name="phone"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.phone && touched.phone ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Email</label>
                                    <Field
                                        type="email"
                                        name="email"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.email && touched.email ? 'border-red-500' : ''}`}
                                        placeholder="name@yourorganizationname.co"
                                    />
                                    <div className="flex items-center mt-1">
                                        <div className="flex-shrink-0 text-blue-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="ml-1 text-xs text-blue-600">Format: name@yourorganizationname.co</p>
                                    </div>
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Personal Email</label>
                                    <Field
                                        type="email"
                                        name="personalEmail"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.personalEmail && touched.personalEmail ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="personalEmail" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Location</label>
                                    <Field
                                        type="text"
                                        name="location"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.location && touched.location ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="location" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Slack Id</label>
                                    <Field
                                        type="text"
                                        name="slackId"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.slackId && touched.slackId ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="slackId" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">Joining Date</label>
                                    <Field
                                        type="date"
                                        name="joiningDate"
                                        className={`w-full border rounded-md px-3 py-2 ${errors.joiningDate && touched.joiningDate ? 'border-red-500' : ''}`}
                                    />
                                    <ErrorMessage name="joiningDate" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm mb-1">Password</label>
                                    <Field
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className={`w-full border rounded-md px-3 py-2 pr-10 ${errors.password && touched.password ? 'border-red-500' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-8 text-gray-500"
                                        onClick={() => setShowPassword((v) => !v)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm mb-1">Profile Image</label>
                                <input
                                    type="file"
                                    name="profileImage"
                                    onChange={(e) => setFieldValue('profileImage', e.target.files?.[0])}
                                    className="w-full"
                                />
                            </div>
                            {validationError && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {validationError}
                                </div>
                            )}
                            {successMessage && (
                                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                    {successMessage}
                                </div>
                            )}
                            <div className="flex justify-end mt-6 space-x-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 ${inviteLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    disabled={inviteLoading}
                                    onClick={async () => {
                                        // Manual validation for only email, personal email, and password
                                        const { email, personalEmail, password } = values;
                                        let errorMessage = '';

                                        if (!email) {
                                            errorMessage = 'Email is required';
                                        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
                                            errorMessage = 'Invalid email address';
                                        } else if (!personalEmail) {
                                            errorMessage = 'Personal email is required';
                                        } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(personalEmail)) {
                                            errorMessage = 'Invalid personal email address';
                                        } else if (!password || password.length < 6) {
                                            errorMessage = 'Password must be at least 6 characters';
                                        }

                                        if (errorMessage) {
                                            setValidationError(errorMessage);
                                        } else {
                                            setValidationError(null);
                                            setInviteLoading(true);

                                            try {
                                                // Call the backend API
                                                const response = await axios.post('https://ems-server-0bvq.onrender.com/inviteClient', {
                                                    email,
                                                    personalEmail,
                                                    password
                                                });

                                                console.log('Client invited successfully:', response.data);
                                                // Show success message
                                                setSuccessMessage('Client invitation email sent successfully!');
                                            } catch (error) {
                                                console.error('Error inviting client:', error);
                                                setValidationError('Failed to invite client. Please try again.');
                                            } finally {
                                                setInviteLoading(false);
                                            }
                                        }
                                    }}
                                >
                                    {inviteLoading ? 'Inviting...' : 'Invite Client'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-md bg-purple-600 text-white font-semibold ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                                >
                                    {isLoading ? 'Creating...' : 'Save Client'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default AddClientModal;