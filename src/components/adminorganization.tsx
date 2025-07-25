import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MapPinIcon, UsersIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useUser } from '../contexts/UserContext';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const AdminOrganization: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationExists, setLocationExists] = useState(false);
    const [locationData, setLocationData] = useState<{ longitude: string; latitude: string } | null>(null);
    const [organizationData, setOrganizationData] = useState<any>(null);
    const [userCount, setUserCount] = useState<number>(0);
    const [projectCount, setProjectCount] = useState<number>(0);
    const [clientCount, setClientCount] = useState<number>(0); // <-- Added for clients
    const { userProfile } = useUser();

    useEffect(() => {
        const fetchOrganizationData = async () => {
            if (userProfile?.organization_id) {
                // Fetch location data
                const { data: locationData } = await supabase
                    .from('Location')
                    .select('longitude, latitude')
                    .eq('organization_id', userProfile.organization_id)
                    .single();

                if (locationData) {
                    setLocationExists(true);
                    setLocationData({
                        longitude: locationData.longitude.toString(),
                        latitude: locationData.latitude.toString()
                    });
                } else {
                    setLocationExists(false);
                    setLocationData(null);
                }

                // Fetch organization details
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('name, slug, description, is_active')
                    .eq('id', userProfile.organization_id)
                    .single();

                if (orgData) {
                    setOrganizationData(orgData);
                }

                // Fetch user count
                const { count: usersCount } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', userProfile.organization_id);

                setUserCount(usersCount || 0);

                // Fetch project count
                const { count: projectsCount } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', userProfile.organization_id);

                setProjectCount(projectsCount || 0);

                // Fetch client count (users with role 'client')
                const { count: clientsCount } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', userProfile.organization_id)
                    .eq('role', 'client');

                setClientCount(clientsCount || 0);
            }
        };

        fetchOrganizationData();
    }, [userProfile]);

    const closeModal = () => setIsOpen(false);
    const openModal = () => setIsOpen(true);

    // Define validation schema using Yup
    const LocationSchema = Yup.object().shape({
        longitude: Yup.number()
            .required('Longitude is required')
            .typeError('Longitude must be a number')
            .min(-180, 'Longitude must be between -180 and 180')
            .max(180, 'Longitude must be between -180 and 180'),
        latitude: Yup.number()
            .required('Latitude is required')
            .typeError('Latitude must be a number')
            .min(-90, 'Latitude must be between -90 and 90')
            .max(90, 'Latitude must be between -90 and 90')
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

    const getCurrentLocation = async (setFieldValue: any) => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                setFieldValue('longitude', longitude.toFixed(6));
                setFieldValue('latitude', latitude.toFixed(6));
                setGettingLocation(false);
                toast.success('Location detected successfully');
            },
            (error) => {
                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        toast.error('Location permission denied. Please enable location access.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        toast.error('Location information is unavailable.');
                        break;
                    case error.TIMEOUT:
                        toast.error('Location request timed out.');
                        break;
                    default:
                        toast.error('An unknown error occurred while getting location.');
                        break;
                }
            },
            options
        );
    };

    return (
        <>
            <div className="bg-white rounded-md p-8 mt-4 mx-auto max-w-6xl">
                <div className="flex items-center justify-between mb-6">
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

                {organizationData && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="text-base text-gray-900">{organizationData.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Slug</p>
                                <p className="text-base text-gray-900">{organizationData.slug || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <p className="text-base text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${organizationData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {organizationData.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-500">Description</p>
                            <p className="text-base text-gray-900">{organizationData.description || 'No description available'}</p>
                        </div>
                    </div>
                )}

                {/* Updated grid to 3 columns for the new card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-100 mr-4">
                                <UsersIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Member</p>
                                <p className="text-2xl font-bold text-gray-900">{userCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 mr-4">
                                <FolderIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Projects</p>
                                <p className="text-2xl font-bold text-gray-900">{projectCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* New Card for Total Clients */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 mr-4">
                                <UsersIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                                <p className="text-2xl font-bold text-gray-900">{clientCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
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
                                        {({ errors, touched, setFieldValue }) => (
                                            <Form>
                                                <div className="mb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => getCurrentLocation(setFieldValue)}
                                                        disabled={gettingLocation}
                                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-purple-600 text-purple-600 font-medium ${gettingLocation
                                                            ? 'opacity-70 cursor-not-allowed bg-purple-50'
                                                            : 'hover:bg-purple-50 hover:text-purple-700'
                                                            }`}
                                                    >
                                                        <MapPinIcon className="h-5 w-5" />
                                                        {gettingLocation ? 'Getting Location...' : 'Set My Location'}
                                                    </button>
                                                </div>

                                                <div className="relative mb-4">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-gray-300"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-sm">
                                                        <span className="px-2 bg-white text-gray-500">Or enter manually</span>
                                                    </div>
                                                </div>

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
                                                        disabled={loading || gettingLocation}
                                                        className={`px-4 py-2 rounded-md bg-purple-600 text-white font-semibold ${loading || gettingLocation
                                                            ? 'opacity-70 cursor-not-allowed'
                                                            : 'hover:bg-purple-700'
                                                            }`}
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