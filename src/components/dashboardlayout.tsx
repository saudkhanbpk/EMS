import React from 'react';
import { useUser } from '../contexts/UserContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { userProfile, loading, refreshUserProfile } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!userProfile) {
        return refreshUserProfile()
    }

    if (userProfile.role === 'client') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                textAlign: 'center',
                padding: '20px'
            }}>
                <img
                    src="/construction.svg"
                    alt="Under Construction"
                    style={{
                        maxWidth: '200px',
                        marginBottom: '20px'
                    }}
                />
                <h1 style={{
                    fontSize: '2.5rem',
                    marginBottom: '15px'
                }}>
                    Under Construction
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: '#666'
                }}>
                    We're working hard to bring you something amazing. Please check back soon!
                </p>
            </div>
        );
    }

    // For non-client users, render the children (the actual dashboard)
    return <>{children}</>;
};

export default DashboardLayout;