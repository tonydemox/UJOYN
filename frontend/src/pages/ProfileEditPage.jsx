// src/pages/ProfileEditPage.jsx
import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Chip, Avatar, Alert, CircularProgress } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import axiosInstance from '../api/axiosInstance';
import './ProfileEditPage.css';
import CitySearchSelect from '../components/CitySearchSelect';
import '../components/CitySearchSelect.css';

export default function ProfileEditPage() {
    const { user, setUser } = useAuth();
    const [hobbies, setHobbies] = useState(user?.hobbies?.join(', ') || '');

    const [avatarPreview, setAvatarPreview] = useState(
        user?.profilePicture || null
    );
    const [avatarFile, setAvatarFile] = useState(null);

    const [coverPreview, setCoverPreview] = useState(
        user?.coverPhoto || null
    );
    const [coverFile, setCoverFile] = useState(null);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(
        user?.city ? { name: user.city.name, province: user.city.province } : null
    );

    useEffect(() => {
        axiosInstance.get('/cities').then(({ data }) => setCities(data));
    }, []);

    const navigate = useNavigate();



    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    function handleCoverChange(e) {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    }

    const hobbyList = hobbies.split(',').map((h) => h.trim()).filter(Boolean);


    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('hobbies', JSON.stringify(hobbyList));

            if (selectedCity && selectedCity.lat && selectedCity.lng) {
                formData.append(
                    'city',
                    JSON.stringify({
                        name: selectedCity.name,
                        province: selectedCity.province,
                        coordinates: [selectedCity.lng, selectedCity.lat],
                    })
                );
            }

            if (avatarFile) formData.append('profilePicture', avatarFile);

            if (coverFile) formData.append('coverPhoto', coverFile);


            const { data } = await axiosInstance.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUser(data);
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Errore durante l\'aggiornamento');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="edit-page">
            <h1>Modifica profilo</h1>

            {error && <Alert severity="error" className="edit-error">{error}</Alert>}

            <form onSubmit={handleSubmit} className="edit-layout">
                <div className="edit-main-card bubble-card">
                    <div
                        className="edit-cover"
                        style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
                    >
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<PhotoCamera />}
                            className="edit-cover-button"
                        >
                            Cambia copertina
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverChange} hidden />
                        </Button>
                    </div>

                    <div className="edit-main-body">
                        <div className="edit-avatar-wrapper">
                            <Avatar src={avatarPreview} className="edit-avatar">
                                {!avatarPreview && user?.nickname?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Button component="label" className="edit-avatar-button" aria-label="Cambia foto profilo">
                                <PhotoCamera fontSize="small" />
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} hidden />
                            </Button>
                        </div>

                        <TextField
                            label="Hobby (separati da virgola)"
                            value={hobbies}
                            onChange={(e) => setHobbies(e.target.value)}
                            fullWidth
                            variant="outlined"
                            className="edit-hobby-input"
                        />

                        {hobbyList.length > 0 && (
                            <div className="edit-hobby-preview">
                                {hobbyList.map((hobby) => (
                                    <Chip key={hobby} label={hobby} className="edit-hobby-chip" />
                                ))}
                            </div>
                        )}

                        <label className="edit-city-label">
                            Città
                            <CitySearchSelect cities={cities} value={selectedCity} onSelect={setSelectedCity} />
                        </label>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            className="edit-save-button"
                        >
                            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Salva modifiche'}
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/profile')}
                            className="edit-cancel-button"
                        >
                            Annulla
                        </Button>

                    </div>
                </div>
            </form>
        </div>
    );
}