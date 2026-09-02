import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { setAccessToken } from '../auth/tokenStore';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';
import axiosInstance from "../api/axiosInstance";
import {Container} from "react-bootstrap";

import {Alert, Button, TextField, Typography} from "@mui/material";


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
        <div className="auth-page auth-page">
            <Container fluid className="auth-container" style={{ maxWidth: '500px', margin: '0 auto' }}>


                {error && <Alert severity="error" className="auth-error">{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-form-card bubble-card">
                        <Typography variant="h4" className="auth-title">Accedi</Typography>
                        <div className="auth-section">
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                required
                            />
                        </div>

                        <div className="auth-section">
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                className="auth-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
                            </Button>

                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Accesso con Google fallito')}
                                useOneTap={false}
                                theme="outline"
                                size="large"
                                shape="pill"
                                text="continue_with"
                                width="100%"
                            />

                            <Typography variant="body2" style={{ textAlign: 'center', marginTop: '8px', color: 'var(--text-soft)' }}>
                                Non hai un account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Registrati</Link>
                            </Typography>
                        </div>
                    </div>
                </form>
            </Container>
        </div>
    );
}