import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { setAccessToken } from '../auth/tokenStore';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';
import axiosInstance from "../api/axiosInstance";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, setUser } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante il login');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleSuccess(credentialResponse) {
        try {
            const { data } = await axiosInstance.post('/auth/google', {
                credential: credentialResponse.credential,
            });
            setAccessToken(data.accessToken);
            setUser(data.user);

            if (data.isNewUser || !data.user.isProfileComplete) {
                navigate('/complete-profile');
            } else {
                navigate('/feed');
            }
        } catch (err) {
            setError('Errore durante l\'accesso con Google');
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form bubble-card">
                <h1>Accedi</h1>


                {error && <p className="auth-error">{error}</p>}

                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
                </button>

                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Accesso con Google fallito')}
                    useOneTap={false}
                />

                <p>
                    Non hai un account? <Link to="/register">Registrati</Link>
                </p>
            </form>
        </div>
    );
}