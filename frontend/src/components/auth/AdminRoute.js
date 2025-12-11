import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AdminRoute({ children }) {
    const { currentUser, isSuperAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // Bypass for testing if logic is strict, but here we expect roles to be set.
    // For initial dev, enable this bypass if needed:
    // if (currentUser) return children; 

    if (!currentUser || !isSuperAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
