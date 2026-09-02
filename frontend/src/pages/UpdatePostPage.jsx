import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {Alert, Button, Card, CardContent, CircularProgress, TextField, Typography} from "@mui/material";
import './UpdatePostPage.css';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {Container} from "react-bootstrap";
import CitySearchSelect from "../components/CitySearchSelect";
import '../components/CitySearchSelect.css';

export default function UpdatePostPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const { post, setPost } = useState(null);
    const [title, setTitle] = useState(post?.title || '');
    const [description, setDescription] = useState(post?.description || '');
    const [category, setCategory] = useState(post?.category || '');
    const [date, setDate] = useState(post?.date || '');
    const [minAge, setMinAge] = useState(post?.minAge || '');
    const [maxAge, setMaxAge] = useState(post?.maxAge || '');
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(post?.city || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        axiosInstance.get('/cities').then(({ data }) => setCities(data));
    }, []);

    useEffect(() => {
        axiosInstance
            .get(`/posts/${id}`)
            .then(({ data }) => {
                setTitle(data.title);
                setDescription(data.description);
                setCategory(data.category);
                setDate(data.date);
                setSelectedCity(data.city);
                setMinAge(data.minAge);
                setMaxAge(data.maxAge);
            })
            .catch(() => setError('Impossibile caricare l\'attività'))
            .finally(() => setIsLoading(false));
    }, [id]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try{
            await axiosInstance.put(`/posts/${id}`, {
               title,
               description,
               category,
               date,
                city: {
                    name: selectedCity.name,
                    province: selectedCity.province,
                    coordinates: [selectedCity.lng, selectedCity.lat],
                },
               minAge: Number(minAge),
               maxAge: Number(maxAge),
                });
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante l\'aggiornamento');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="update-post-loading">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="update-post-page">
            <Typography variant="h4" className="update-post-title">Modifica attività</Typography>

            <Card variant="outlined" className="update-post-form-card bubble-card">
                <CardContent>
                    <form onSubmit={handleSubmit} className="update-post-form">
                        {error && <Alert severity="error">{error}</Alert>}

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
                        />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                label="Data e ora"
                                value={date ? dayjs(date) : null}
                                onChange={(newValue) => setDate(newValue ? newValue.toISOString() : '')}
                                slotProps={{
                                    textField: { fullWidth: true, required: true },
                                }}
                            />
                        </LocalizationProvider>
                        <label className="create-post-city-label">
                            <CitySearchSelect cities={cities} value={selectedCity} onSelect={setSelectedCity} />
                        </label>
                        <TextField
                            label="Età minima"
                            type="number"
                            value={minAge}
                            onChange={(e) => setMinAge(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Età massima"
                            type="number"
                            value={maxAge}
                            onChange={(e) => setMaxAge(e.target.value)}
                            fullWidth
                        />

                        <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}