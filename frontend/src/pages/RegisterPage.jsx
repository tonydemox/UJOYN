import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import axiosInstance from '../api/axiosInstance';
import CitySearchSelect from '../components/CitySearchSelect';
import {Container} from "react-bootstrap";
import {Alert, Button, TextField, Typography} from "@mui/material";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import '../components/CitySearchSelect.css';
import './RegisterPage.css';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        hobbies: '',
        cityId: '',
    });

    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [birthDate, setBirthDate] = useState(null);

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
        console.log('handleSubmit chiamato, selectedCity:', selectedCity);
        setError('');

        if (!selectedCity) {
            setError('Seleziona un comune');
            return;
        }

        if (!birthDate) {
            setError('Inserisci la data di nascita');
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post('/auth/register', {
                nickname: formData.nickname,
                email: formData.email,
                password: formData.password,
                birthDate: birthDate.toISOString(),
                hobbies: formData.hobbies.split(',').map((h) => h.trim()).filter(Boolean),
                city: {
                    name: selectedCity.name,
                    province: selectedCity.province,
                    coordinates: [selectedCity.lng, selectedCity.lat],
                },
            });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante la registrazione');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="register-page register-page">
            <Container fluid className="register-container" style={{ maxWidth: '500px', margin: '0 auto' }}>


                {error && <Alert severity="error" className="register-error">{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <div className="register-form-card bubble-card">
                        <Typography variant="h4" className="register-title">Registrati</Typography>
                        <div className="register-section">
                            <TextField
                                label="Nickname"
                                name="nickname"
                                value={formData.nickname}
                                onChange={handleChange}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                required
                            />

                            <TextField
                                label="Hobby"
                                name="hobbies"
                                value={formData.hobbies}
                                onChange={handleChange}
                                fullWidth
                                placeholder="calcio, lettura, cucina"
                                helperText="Separati da virgola"
                            />

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Data di nascita"
                                    value={birthDate}
                                    onChange={(newValue) => setBirthDate(newValue)}
                                    slotProps={{ textField: { fullWidth: true, required: true } }}
                                    maxDate={dayjs().subtract(14, 'year')}
                                />
                            </LocalizationProvider>
                        </div>

                        <label className="register-city-label">
                            Città
                            <CitySearchSelect cities={cities} value={selectedCity} onSelect={setSelectedCity} />
                        </label>

                        <div className="register-section">
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                className="register-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
                            </Button>

                            <Typography variant="body2" style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-soft)' }}>
                                Hai già un account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Accedi</Link>
                            </Typography>
                        </div>
                    </div>
                </form>
            </Container>
        </div>
    );
}