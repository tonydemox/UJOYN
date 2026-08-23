import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <p>Caricamento...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}