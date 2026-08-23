import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { Avatar, Button, Chip, Typography, CircularProgress } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';
import './ProfilePage.css';

export default function PublicProfilePage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { refreshUser } = useAuth();

    useEffect(() => {
        setIsLoading(true);
        axiosInstance
            .get(`/users/${id}`)
            .then(({data}) => {
                if (data.isOwnProfile) {
                    navigate('/profile');
                    return;
                }
                setProfile(data);
            })
            .finally(() => setIsLoading(false));
    }, [id, navigate]);

    async function handleAddFriend() {
        try {
            await axiosInstance.post(`/friends/request/${id}`);
            setProfile((prev) => ({ ...prev, friendshipStatus: 'pending' }));
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'invio della richiesta');
        }
    }

    async function handleRemoveRequest() {
        try {
            await axiosInstance.delete(`/friends/remove/${id}`);
            setProfile((prev) => ({ ...prev, friendshipStatus: 'none', friendshipId: null  }));
        }catch (err) {
            alert(err.response?.data?.message || 'Errore durante la rimozione della richiesta');
        }
    }

    async function handleRemoveFriend() {
        try {
            await axiosInstance.delete(`/friends/${id}`);
            setProfile((prev) => ({
                ...prev,
                friendshipStatus: 'none',
                friendshipId: null,
                friendsCount: prev.friendsCount - 1,
            }));
            refreshUser();
        }catch (err) {
            alert(err.response?.data?.message || 'Errore durante la rimozione della richiesta');
        }
    }

    async function handleAccept() {
        try {
            await axiosInstance.post(`/friends/accept/${profile.friendshipId}`);
            setProfile((prev) => ({ ...prev, friendshipStatus: 'accepted', requestDirection: null, friendsCount: prev.friendsCount + 1, }));
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'accettazione');
        }
    }

    async function handleReject() {
        try {
            await axiosInstance.post(`/friends/reject/${profile.friendshipId}`);
            setProfile((prev) => ({ ...prev, friendshipStatus: 'none', friendshipId: null, requestDirection: null }));
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante il rifiuto');
        }
    }

    if (isLoading) {
        return (
            <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <CircularProgress />
            </div>
        );
    }

    if (!profile) return <Typography className="profile-loading">Profilo non trovato.</Typography>;

    const avatarUrl = profile.profilePicture || null;
    const coverUrl = profile.coverPhoto || null;

    return(
        <div className="profile-page">
            <div className="profile-header-card bubble-card">
                <div
                    className="profile-card-cover"
                    style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                />

                <div className="profile-card-body">
                    <Row className="row profile-top-row align-items-end justify-content-between">
                        <Col xs="auto">
                            <Avatar src={avatarUrl} className="profile-avatar">
                                {!avatarUrl && profile.nickname.charAt(0).toUpperCase()}
                            </Avatar>
                        </Col>
                        <Col xs="auto">
                            {profile.friendshipStatus === 'accepted' ? (
                                <Button variant="outlined" onClick={handleRemoveFriend} className="profile-reject-button">
                                    Rimuovi amico
                                </Button>
                            ) : profile.friendshipStatus === 'pending' && profile.requestDirection === 'sent'  ? (
                                <Button variant="outlined" onClick={handleRemoveRequest} className="profile-reject-button">
                                    Rimuovi richiesta
                                </Button>
                            ) : profile.friendshipStatus === 'pending' && profile.requestDirection === 'received' ? (
                                <div className="profile-request-actions">
                                    <Button variant="contained" onClick={handleAccept} className="profile-edit-button">
                                        Accetta
                                    </Button>
                                    <Button variant="outlined" onClick={handleReject} className="profile-reject-button">
                                        Rifiuta
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant={profile.friendshipStatus === 'none' ? 'contained' : 'outlined'}
                                    disabled={profile.friendshipStatus !== 'none'}
                                    onClick={handleAddFriend}
                                    className="profile-edit-button"
                                >
                                    {profile.friendshipStatus === 'pending' ? 'Richiesta inviata' : 'Aggiungi amico'}
                                </Button>
                            )}
                        </Col>
                    </Row>

                    <Typography variant="h5" className="profile-nickname">{profile.nickname}</Typography>
                    <Typography className="profile-subtitle">
                        <LocationOn className="profile-subtitle-icon" />
                        {profile.city?.name && <span>{profile.city.name}{profile.city.province ? `, ${profile.city.province}` : ''}</span>}
                        {profile.city?.name && <span className="profile-subtitle-dot">·</span>}
                        <span>{profile.age} anni</span>
                    </Typography>
                </div>
            </div>

            <Row className="profile-lower-row g-4">
                <Col md={8}>
                    <div className="profile-content-card bubble-card">
                        <Typography variant="subtitle1" className="profile-section-title">Hobby</Typography>
                        {profile.hobbies?.length > 0 ? (
                            <div className="profile-hobby-tags">
                                {profile.hobbies.map((hobby) => (
                                    <Chip key={hobby} label={hobby} className="profile-hobby-chip" />
                                ))}
                            </div>
                        ) : (
                            <div className="profile-feed-empty">
                                <Typography>Nessun hobby indicato.</Typography>
                            </div>
                        )}
                    </div>
                </Col>

                <Col md={4}>
                    <div className="profile-stats-card bubble-card">
                        <Typography variant="subtitle2" className="profile-stats-title">Statistiche</Typography>
                        <div className="profile-stats-grid">
                            <div className="profile-stat-block">
                                <span className="profile-stat-value">{profile.friendsCount}</span>
                                <span className="profile-stat-label">Amici</span>
                            </div>
                            <div className="profile-stat-block">
                                <span className="profile-stat-value">{profile.eventsCount}</span>
                                <span className="profile-stat-label">Eventi</span>
                            </div>
                            <div className="profile-stat-block">
                                <span className="profile-stat-value">{profile.postsCount}</span>
                                <span className="profile-stat-label">Post</span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );


}
