import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { TextField, Button, Alert, Typography, Chip } from '@mui/material';
import { InfoOutlined, EventOutlined, People } from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axiosInstance from '../api/axiosInstance';
import CitySearchSelect from '../components/CitySearchSelect';
import '../components/CitySearchSelect.css';
import './CreatePostPage.css';


export default function CreatePostPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [minAge, setMinAge] = useState(18);
    const [maxAge, setMaxAge] = useState(99);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance.get('/cities').then(({ data }) => setCities(data));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!selectedCity) {
            setError('Seleziona un comune');
            return;
        }

        if (!date || !time) {
            setError('Inserisci data e ora');
            return;
        }

        setIsSubmitting(true);
        try {
            const combinedDate = date
                .hour(time.hour())
                .minute(time.minute())
                .second(0)
                .toISOString();

            await axiosInstance.post('/posts', {
                title,
                description,
                category: category.trim().toLowerCase(),
                date: combinedDate,
                minAge,
                maxAge,
                city: {
                    name: selectedCity.name,
                    province: selectedCity.province,
                    coordinates: [selectedCity.lng, selectedCity.lat],
                },
            });
            navigate('/feed');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante la creazione');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="create-post-page">
            <Container fluid className="create-post-container">
                <Typography variant="h4" className="create-post-title">Nuova attività</Typography>

                {error && <Alert severity="error" className="create-post-error">{error}</Alert>}

                <form onSubmit={handleSubmit} className="create-post-layout">
                    <div className="create-post-form-card bubble-card">
                        <div className="create-post-section">
                            <Typography variant="subtitle1" className="create-post-section-title">
                                <InfoOutlined className="create-post-section-icon" />
                                Informazioni base
                            </Typography>
                            <TextField label="Titolo" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
                            <TextField
                                label="Descrizione"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                required
                            />
                            <TextField
                                label="Categoria"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                fullWidth
                                required
                                placeholder="calcio, lettura, musica..."
                            />
                        </div>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div className="create-post-row">
                                <DatePicker
                                    label="Data"
                                    value={date}
                                    onChange={(newValue) => setDate(newValue)}
                                    slotProps={{ textField: { fullWidth: true, required: true } }}
                                />
                                <TimePicker
                                    label="Ora"
                                    value={time}
                                    onChange={(newValue) => setTime(newValue)}
                                    slotProps={{ textField: { fullWidth: true, required: true } }}
                                />
                            </div>
                        </LocalizationProvider>

                            <label className="create-post-city-label">
                                <CitySearchSelect cities={cities} value={selectedCity} onSelect={setSelectedCity} />
                            </label>

                        <div className="create-post-section">
                            <Typography variant="subtitle1" className="create-post-section-title">
                                <People className="create-post-section-icon" />
                                Chi può partecipare
                            </Typography>
                            <div className="create-post-row">
                                <TextField
                                    label="Età minima"
                                    type="number"
                                    value={minAge}
                                    onChange={(e) => setMinAge(Number(e.target.value))}
                                    fullWidth
                                />
                                <TextField
                                    label="Età massima"
                                    type="number"
                                    value={maxAge}
                                    onChange={(e) => setMaxAge(Number(e.target.value))}
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>

                    <div className="create-post-preview-card bubble-card">
                        <Typography variant="subtitle2" className="create-post-preview-title">Anteprima</Typography>
                        <div className="create-post-preview-box">
                            {category && <Chip label={category} size="small" className="create-post-preview-chip" />}
                            <Typography className="create-post-preview-name">{title || 'Titolo attività'}</Typography>
                            <Typography className="create-post-preview-desc">
                                {description || 'La descrizione comparirà qui...'}
                            </Typography>
                            {selectedCity && (
                                <Typography className="create-post-preview-meta">
                                    {selectedCity.name}{selectedCity.province ? `, ${selectedCity.province}` : ''}
                                </Typography>
                            )}
                        </div>
                        <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} className="create-post-submit">
                            {isSubmitting ? 'Pubblicazione...' : 'Pubblica attività'}
                        </Button>
                    </div>
                </form>
            </Container>
        </div>
    );
}