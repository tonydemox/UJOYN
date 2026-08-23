// src/pages/RegisterPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axiosInstance from '../api/axiosInstance';
import './RegisterPage.css';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        birthDate: '',
        hobbies: '',
        cityId: '',
    });
    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function loadCities() {
            try {
                const { data } = await axiosInstance.get('/cities');
                setCities(data);
            } catch {
                setError('Impossibile caricare l\'elenco dei comuni');
            }
        }
        loadCities();
    }, []);

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const selectedCity = cities.find((c) => c._id === formData.cityId);

        try {
            await register({
                nickname: formData.nickname,
                email: formData.email,
                password: formData.password,
                birthDate: formData.birthDate,
                hobbies: formData.hobbies.split(',').map((h) => h.trim()).filter(Boolean),
                city: {
                    name: selectedCity.name,
                    province: selectedCity.province,
                    coordinates: [selectedCity.lng, selectedCity.lat],
                },
            });
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante la registrazione');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form">
                <h1>Registrati</h1>

                {error && <p className="auth-error">{error}</p>}

                <label>
                    Nickname
                    <input name="nickname" value={formData.nickname} onChange={handleChange} required />
                </label>

                <label>
                    Email
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </label>

                <label>
                    Password
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </label>

                <label>
                    Data di nascita
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
                </label>

                <label>
                    Hobby (separati da virgola)
                    <input name="hobbies" value={formData.hobbies} onChange={handleChange} placeholder="calcio, lettura, cucina" />
                </label>

                <label>
                    Città
                    <select name="cityId" value={formData.cityId} onChange={handleChange} required>
                        <option value="">Seleziona un comune</option>
                        {cities.map((city) => (
                            <option key={city._id} value={city._id}>
                                {city.name} ({city.province})
                            </option>
                        ))}
                    </select>
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
                </button>

                <p>
                    Hai già un account? <Link to="/login">Accedi</Link>
                </p>
            </form>
        </div>
    );
}