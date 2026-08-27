import { useState, useEffect, useCallback } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import {Avatar, Button, Chip, Typography, Tabs, Tab, Paper, InputBase, IconButton,  } from '@mui/material';
import { Search, Close, LocationOn, PeopleAlt, CalendarMonth, Article, Edit, Delete, PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useSocket } from '../socket/SocketContext';
import axiosInstance from '../api/axiosInstance';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, isLoading } = useAuth();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('info');
    const [myPosts, setMyPosts] = useState([]);
    const [myPhotos, setMyPhotos] = useState([]);
    const [joinedPosts, setJoinedPosts] = useState([]);
    const [isCoverExpanded, setIsCoverExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [participantsDialog, setParticipantsDialog] = useState(null);
    const [uploadingPhotoFor, setUploadingPhotoFor] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance.get('/posts/mine').then(({ data }) => setMyPosts(data));
        axiosInstance.get('/posts/mine/photos').then(({ data }) => setMyPhotos(data));
        axiosInstance.get('posts/mine/events').then(({ data }) => setJoinedPosts(data));
    }, []);

    const handleSearch = useCallback((query) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        axiosInstance.get(`/friends/search?query=${encodeURIComponent(query)}`).then(({ data }) => {
            setSearchResults(data);
        });
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => handleSearch(searchQuery), 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, handleSearch]);

    useEffect(() => {
        if (!socket) return;

        function handleNewPhoto({ postId, photo }) {
            if (photo.uploadedBy === user.id) {
                setMyPhotos((prev) => [...prev, { ...photo, postId }]);
            }
        }

        socket.on('new_photo', handleNewPhoto);
        return () => socket.off('new_photo', handleNewPhoto);
    }, [socket, user.id]);

    async function handleLeave(postId){
        try {
            await axiosInstance.post(`/posts/${postId}/leave`);
            setJoinedPosts((prev) => prev.filter((post) => post._id !== postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante la rimozione');
        }
    }

    async function handleAddFriend(userId) {
        try {
            await axiosInstance.post(`/friends/request/${userId}`);
            setSearchResults((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'pending' } : u))
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'invio della richiesta');
        }
    }

    async function handleRemoveFriend(userId) {
        try {
            await axiosInstance.delete(`/friends/remove/${userId}`);
            setSearchResults((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'none' } : u))
            );
        }catch (err) {
            alert(err.response?.data?.message || 'Errore durante la rimozione della richiesta');
        }
    }

    async function handleDeletePost(postId) {
        if (!window.confirm('Sei sicuro di voler eliminare questa attività?')) return;
        try{
            await axiosInstance.delete(`/posts/${postId}`);
            setMyPosts((prev) => prev.filter((p) => p._id !==postId));
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'eliminazione');
        }
    }

    async function handleViewParticipants(postId) {
        try {
            const { data } = await axiosInstance.get(`/posts/${postId}/participants`);
            setParticipantsDialog({ postId, list: data });
            navigate(`/participants/${postId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Errore nel recupero dei partecipanti');
        }
    }

    async function handlePhotoUpload(postId, file) {
        try{
            const formData = new FormData();
            formData.append('photo', file);
            const { data } = await axiosInstance.post(`/posts/${postId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const newPhoto = data.photos[data.photos.length - 1];
            setMyPhotos((prev) => [
                ...prev,
                { _id: newPhoto._id,   url: newPhoto.url, uploadedAt: newPhoto.uploadedAt, postTitle: data.title, postId: data._id },
            ]);
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante il caricamento');
        } finally {
            setUploadingPhotoFor(null);
        }
    }

    async function handleDeletePhoto(postId, photoId) {
        try{

            const { data } = await axiosInstance.delete(`/posts/${postId}/photos/${photoId}`)
            setMyPhotos((prev) => prev.filter((photo) => photo._id !== photoId));
        }  catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'eliminazione della foto');
        }
    }

    if (isLoading) return <Typography className="profile-loading">Caricamento profilo...</Typography>;
    if (!user) return <Typography className="profile-loading">Devi accedere per vedere il tuo profilo.</Typography>;

    const avatarUrl = user.profilePicture || null;
    const coverUrl = user.coverPhoto || null;

    return (
        <div className="profile-page">
            <Container fluid className="profile-page-container">
                <div className="profile-search-wrapper">
                    <Paper component="div" className="profile-search-bar" elevation={0}>
                        <Search className="profile-search-icon" />
                        <InputBase
                            placeholder="Cerca persone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            fullWidth
                            className="profile-search-input"
                        />
                        {searchQuery && (
                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                <Close fontSize="small" />
                            </IconButton>
                        )}
                    </Paper>

                    {searchResults.length > 0 && (
                        <Paper className="profile-search-dropdown" elevation={3}>
                            {searchResults.map((u) => (
                                <div key={u.id} className="profile-search-result-item">
                                    <Avatar
                                        src={u.profilePicture ? `http://localhost:5000${u.profilePicture}` : undefined}
                                        className="profile-search-avatar"
                                    >
                                        {u.nickname.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography
                                                className="profile-search-nickname"
                                                onClick={() => navigate(`/users/${u.id}`)}
                                                style={{ cursor: 'pointer' }}
                                    >
                                        {u.nickname}
                                    </Typography>
                                    <Button
                                        variant={u.friendshipStatus === 'none' ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => {
                                            if (u.friendshipStatus === 'none') {
                                                handleAddFriend(u.id);
                                            } else if (u.friendshipStatus === 'pending') {
                                                handleRemoveFriend(u.id);
                                            } else if (u.friendshipStatus === 'accepted') {
                                                handleRemoveFriend(u.id);
                                            }
                                        }}
                                        className="profile-search-add-button"
                                    >
                                        {u.friendshipStatus === 'accepted' ? 'Amici' : u.friendshipStatus === 'pending' ? 'Inviata' : 'Aggiungi'}
                                    </Button>
                                </div>
                            ))}
                        </Paper>
                    )}
                </div>
            </Container>


            <div className="profile-card profile-header-card bubble-card">
                <div
                    className="profile-card-cover"
                    style={coverUrl ? { backgroundImage: `url(${coverUrl})`, cursor: 'pointer' } : undefined}
                    onClick={() => coverUrl && setIsCoverExpanded(true)}
                />

                <div className="profile-card-body">
                    <Row className="row profile-top-row align-items-end justify-content-between">
                        <Col xs="auto">
                            <Avatar src={avatarUrl} className="profile-avatar">
                                    {!avatarUrl && user.nickname.charAt(0).toUpperCase()}
                            </Avatar>
                        </Col>
                        <Col xs="auto">
                            <Button component={Link} to="/profile/edit" variant="contained" className="profile-edit-button">
                                Modifica profilo
                            </Button>
                        </Col>
                    </Row>

                    <Typography variant="h5" className="profile-nickname">{user.nickname}</Typography>
                    <Typography className="profile-subtitle">
                        <LocationOn className="profile-subtitle-icon" />
                        {user.city?.name && <span>{user.city.name}{user.city.province ? `, ${user.city.province}` : ''}</span>}
                        {user.city?.name && <span className="profile-subtitle-dot">·</span>}
                        <span>{user.age} anni</span>
                    </Typography>

                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} className="profile-tabs">
                        <Tab label="Info" value="info" />
                        <Tab label="Post" value="post" />
                        <Tab label="Eventi" value="eventi" />
                        <Tab label="Foto" value="foto" />
                    </Tabs>
                </div>
            </div>

            {isCoverExpanded && (
                <div className="cover-lightbox" onClick={() => setIsCoverExpanded(false)}>
                    <img src={coverUrl} alt="Copertina a schermo intero" className="cover-lightbox-image" />
                    <button className="cover-lightbox-close" onClick={() => setIsCoverExpanded(false)} aria-label="Chiudi">
                        ✕
                    </button>
                </div>
            )}


            <Row className="profile-lower-row g-4">
                <Col md={8}>
                    <div className="profile-card profile-content-card bubble-card">
                        {activeTab === 'info' && (
                            <>
                                <Typography variant="subtitle1" className="profile-section-title">Hobby</Typography>
                                {user.hobbies?.length > 0 ? (
                                    <div className="profile-hobby-tags">
                                        {user.hobbies.map((hobby) => (
                                            <Chip key={hobby} label={hobby} className="profile-hobby-chip" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="profile-feed-empty">
                                        <Typography>Nessun hobby indicato.</Typography>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'post' && (
                            <>
                                <Typography variant="subtitle1" className="profile-section-title">I miei post</Typography>
                                {myPosts.length === 0 ? (
                                    <div className="profile-feed-empty">
                                        <Typography>Non hai ancora creato nessuna attività.</Typography>
                                    </div>
                                ) : (
                                    <Row className="g-3">
                                        {myPosts.map((post) => {
                                            const isPast = new Date(post.date) < new Date();
                                            return (
                                                <Col key={post._id} xs={12} sm={6}>
                                                    <div className="profile-feed-item">
                                                        <div className="profile-feed-item-header">
                                                            <Typography className="profile-feed-item-title">{post.title}</Typography>
                                                            <div className="profile-feed-item-actions">
                                                                {!isPast && (
                                                                    <>
                                                                        <Button
                                                                            size="small"
                                                                            onClick={() => handleViewParticipants(post._id)}
                                                                            className="profile-feed-item-participants"
                                                                            aria-label="Vedi partecipanti"
                                                                            >
                                                                            Mostra partecipanti
                                                                        </Button>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => navigate(`/posts/${post._id}/edit`)}
                                                                            className="profile-feed-item-edit"
                                                                            aria-label="Modifica attività"
                                                                        >
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleDeletePost(post._id)}
                                                                            className="profile-feed-item-delete"
                                                                            aria-label="Elimina attività"
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </>
                                                                )}
                                                                {isPast && (
                                                                    <>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() => handleViewParticipants(post._id)}
                                                                        className="profile-feed-item-participants"
                                                                        aria-label="Vedi partecipanti"
                                                                    >
                                                                        Mostra partecipanti
                                                                    </Button>
                                                                    <IconButton
                                                                        size="small"
                                                                        component="label"
                                                                        className="profile-feed-item-photo"
                                                                        aria-label="Aggiungi foto"
                                                                    >
                                                                        <PhotoCamera fontSize="small" />
                                                                        <input
                                                                            type="file"
                                                                            accept="image/jpeg,image/png,image/webp"
                                                                            hidden
                                                                            onChange={(e) => e.target.files[0] && handlePhotoUpload(post._id, e.target.files[0])}
                                                                        />
                                                                    </IconButton>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Typography className="profile-feed-item-meta">
                                                            {post.category} · {new Date(post.date).toLocaleDateString('it-IT')} · {new Date(post.date).toLocaleTimeString('it-IT')}
                                                        </Typography>
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                )}
                            </>
                        )}

                        {activeTab === 'eventi' && (
                            <>
                                <Typography variant="subtitle1" className="profile-section-title">Eventi a cui partecipo</Typography>
                                {joinedPosts.length === 0 ? (
                                    <div className="profile-feed-empty">
                                        <Typography>Non hai partecipato a nessun evento</Typography>
                                    </div>
                                ) : (
                                    <Row className="g-3">
                                        {joinedPosts.map((post) => {
                                            const isPast = new Date(post.date) < new Date();
                                            return (
                                                <Col key={post._id} xs={12} sm={6}>
                                                    <div className="profile-feed-item">
                                                        <div className="profile-feed-item-header">
                                                            <Typography className="profile-feed-item-title">{post.title}</Typography>
                                                            <div className="profile-feed-item-actions">
                                                                {isPast && (
                                                                    <IconButton
                                                                        size="small"
                                                                        component="label"
                                                                        className="profile-feed-item-photo"
                                                                        aria-label="Aggiungi foto"
                                                                    >
                                                                        <PhotoCamera fontSize="small" />
                                                                        <input
                                                                            type="file"
                                                                            accept="image/jpeg,image/png,image/webp"
                                                                            hidden
                                                                            onChange={(e) => e.target.files[0] && handlePhotoUpload(post._id, e.target.files[0])}
                                                                        />
                                                                    </IconButton>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Typography className="profile-feed-item-meta">
                                                            {post.category} · {new Date(post.date).toLocaleDateString('it-IT')} · {new Date(post.date).toLocaleTimeString('it-IT')}
                                                        </Typography>
                                                        <Typography className="profile-feed-item-meta">
                                                            Organizzato da {post.author.nickname}
                                                        </Typography>

                                                        {!isPast && (
                                                            <Button
                                                                onClick={() => handleLeave(post._id)}
                                                                variant="outlined"
                                                                fullWidth
                                                                className="feed-card-join"
                                                                style={{ marginTop: 10 }}
                                                            >
                                                                Annulla partecipazione
                                                            </Button>
                                                        )}
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                )}
                            </>
                        )}

                        {activeTab === 'foto' && (
                            <>
                                <Typography variant="subtitle1" className="profile-section-title">Le mie foto</Typography>
                                {myPhotos.length === 0 ? (
                                    <div className="profile-feed-empty">
                                        <Typography>Non hai ancora caricato nessuna foto.</Typography>
                                    </div>
                                ) : (
                                    <Row className="g-2">
                                        {myPhotos.map((photo, i) => (
                                            <Col key={photo._id} xs={6} sm={4}>
                                                <div className="profile-photo-item bubble-card">
                                                    <img src={photo.url} alt={photo.postTitle} />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeletePhoto(photo.postId, photo._id)}
                                                        className="profile-photo-delete"
                                                        aria-label="Elimina foto"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </>
                        )}
                    </div>
                </Col>

                <Col md={4}>
                    <div className="profile-card profile-stats-card bubble-card">
                        <Typography variant="subtitle2" className="profile-stats-title">Statistiche</Typography>
                        <div className="profile-stats-grid">
                            <div className="profile-stat-block" onClick={() => navigate(`/friends/${user.id}`)}>
                                <PeopleAlt className="profile-stat-icon" />
                                <span className="profile-stat-value">{user.friendsCount || 0}</span>
                                <span className="profile-stat-label" >Amici</span>
                            </div>
                            <div className="profile-stat-block">
                                <CalendarMonth className="profile-stat-icon" />
                                <span className="profile-stat-value">{user.eventsCount || 0}</span>
                                <span className="profile-stat-label">Eventi</span>
                            </div>
                            <div className="profile-stat-block">
                                <Article className="profile-stat-icon" />
                                <span className="profile-stat-value">{myPosts.length}</span>
                                <span className="profile-stat-label">Post</span>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}