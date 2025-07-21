import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useUser } from '../contexts/UserContext';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AdminOrganization: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationExists, setLocationExists] = useState(false);
    const [locationData, setLocationData] = useState<{ longitude: string; latitude: string } | null>(null);
    const { userProfile } = useUser();

    // Check if location exists when component mounts or userProfile changes
    useEffect(() => {
        const checkLocationExists = async () => {
            if (userProfile?.organization_id) {
                const { data } = await supabase
                    .from('Location')
                    .select('longitude, latitude')
                    .eq('organization_id', userProfile.organization_id)
                    .single();

                if (data) {
                    setLocationExists(true);
                    setLocationData({
                        longitude: data.longitude.toString(),
                        latitude: data.latitude.toString()
                    });
                } else {
                    setLocationExists(false);
                    setLocationData(null);
                }
            }
        };

        checkLocationExists();
    }, [userProfile]);

    const closeModal = () => setIsOpen(false);
    const openModal = () => setIsOpen(true);

    // Define validation schema using Yup
    const LocationSchema = Yup.object().shape({
        longitude: Yup.number()
            .required('Longitude is required')
            .typeError('Longitude must be a number'),
        latitude: Yup.number()
            .required('Latitude is required')
            .typeError('Latitude must be a number')
    });

    // Initial form values
    const initialValues = locationData || {
        longitude: '',
        latitude: ''
    };

    const handleSubmit = async (values: { longitude: string | number; latitude: string | number }) => {
        if (!userProfile?.organization_id) {
            toast.error('Organization ID not found');
            return;
        }

        setLoading(true);
        try {
            // Check if location already exists for this organization
            const { data: existingLocation } = await supabase
                .from('Location')
                .select('id')
                .eq('organization_id', userProfile.organization_id)
                .single();

            if (existingLocation) {
                // Update existing location
                const { error } = await supabase
                    .from('Location')
                    .update({
                        longitude: Number(values.longitude),
                        latitude: Number(values.latitude),
                    })
                    .eq('organization_id', userProfile.organization_id);

                if (error) throw error;
                toast.success('Location updated successfully');
            } else {
                // Insert new location
                const { error } = await supabase
                    .from('Location')
                    .insert({
                        organization_id: userProfile.organization_id,
                        longitude: Number(values.longitude),
                        latitude: Number(values.latitude),
                    });

                if (error) throw error;
                toast.success('Location added successfully');
            }

            closeModal();
        } catch (error) {
            toast.error(handleSupabaseError(error));
            console.error('Error saving location:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-md p-8 flex items-center justify-between mt-4 mx-auto max-w-6xl">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Detail</h2>
                    <p className="text-gray-500 mt-1">View and manage your organization details here</p>
                </div>
                <button
                    onClick={openModal}
                    className="ml-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold transition"
                >
                    {locationExists ? '+ Update Location' : '+ Set Location'}
                </button>
            </div>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                            {locationExists ? 'Update Location' : 'Set Location'}
                                        </Dialog.Title>
                                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <Formik
                                        key={locationData ? 'edit-form' : 'new-form'}
                                        initialValues={initialValues}
                                        validationSchema={LocationSchema}
                                        onSubmit={handleSubmit}
                                        enableReinitialize
                                    >
                                        {({ errors, touched }) => (
                                            <Form>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Longitude
                                                    </label>
                                                    <Field
                                                        name="longitude"
                                                        type="text"
                                                        className={`w-full border ${errors.longitude && touched.longitude ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                                        placeholder="Enter longitude"
                                                    />
                                                    <ErrorMessage name="longitude" component="div" className="text-red-500 text-sm mt-1" />
                                                </div>
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Latitude
                                                    </label>
                                                    <Field
                                                        name="latitude"
                                                        type="text"
                                                        className={`w-full border ${errors.latitude && touched.latitude ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                                        placeholder="Enter latitude"
                                                    />
                                                    <ErrorMessage name="latitude" component="div" className="text-red-500 text-sm mt-1" />
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={closeModal}
                                                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className={`px-4 py-2 rounded-md bg-purple-600 text-white font-semibold ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                                                    >
                                                        {loading ? 'Saving...' : (locationExists ? 'Update Location' : 'Set Location')}
                                                    </button>
                                                </div>
                                            </Form>
                                        )}
                                    </Formik>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default AdminOrganization;