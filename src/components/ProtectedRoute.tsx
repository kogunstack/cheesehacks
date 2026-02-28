import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen bg-[#0F0F1A] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
