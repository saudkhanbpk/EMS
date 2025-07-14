import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const validationSchema = Yup.object({
    fullName: Yup.string().min(3, 'Full name must be at least 3 characters').required('Full name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
    const [showPassword, setShowPassword] = useState(false);

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

    if (!isOpen) return null;

    const handleSubmit = (values: typeof initialValues) => {
        console.log('Form submitted:', values);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl w-full max-w-2xl p-8 relative">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    <FiX size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-2">Employee Details</h2>
                <div className="h-1 w-full bg-purple-500 mb-6" />
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ setFieldValue, errors, touched }) => (
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
                                    />
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
                            <div className="flex justify-end mt-6 space-x-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
                                    onClick={onClose}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700"
                                >
                                    Save Employee
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