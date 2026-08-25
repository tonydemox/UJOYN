import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import {
    Card, CardContent, Typography, Avatar, Button, CircularProgress,
    List, ListItem, ListItemAvatar, ListItemText,
} from '@mui/material';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';
import './FriendsPage.css';

export default function FriendsPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [receivedRequests, setReceivedRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            axiosInstance.get('/friends/requests').then(({ data }) => setReceivedRequests(data)),
            axiosInstance.get('/notifications').then(({ data }) => setNotifications(data)),
        ]).finally(() => setIsLoading(false));
    }, []);

    async function handleAccept(requestId) {
        try {
            await axiosInstance.post(`/friends/accept/${requestId}`);
            setReceivedRequests((prev) => prev.filter((r) => r._id !== requestId));
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'accettazione');
        }
    }

    async function handleRemove(requestId) {
        try {
            await axiosInstance.delete(`/friends/remove/${requestId}`);
            setReceivedRequests((prev) => prev.filter((r) => r._id !== requestId));
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante il rifiuto');
        }
    }

    const joinNotifications = notifications.filter((n) => n.type === 'post_join');

    if (isLoading) {
        return (
            <div className="friends-page">
                <div className="friends-loading"><CircularProgress /></div>
            </div>
        );
    }

    return (
        <div className="friends-page">
            <Container fluid className="friends-container">

                <Card className="friends-main-card bubble-card" variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle1" className="friends-section-title">
                            Richieste ricevute
                        </Typography>

                        {receivedRequests.length === 0 ? (
                            <Typography color="text.secondary" className="requests-empty">
                                Nessuna richiesta al momento.
                            </Typography>
                        ) : (
                            <List className="friends-request-list">
                                {receivedRequests.map((request) => (
                                    <ListItem key={request._id} className="friends-request-row">
                                        <div
                                            className="friends-request-info"
                                            onClick={() => navigate(`/users/${request.requester._id}`)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={request.requester.profilePicture || undefined}>
                                                    {request.requester.nickname.charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={request.requester.nickname} />
                                        </div>

                                        <div className="friends-request-actions">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleAccept(request._id)}
                                                className="friends-card-accept"
                                            >
                                                Accetta
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleRemove(request._id)}
                                                className="friends-card-reject"
                                            >
                                                Rifiuta
                                            </Button>
                                        </div>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>


                <Card className="friends-main-card bubble-card" variant="outlined" style={{ marginTop: 24 }}>
                    <CardContent>
                        <Typography variant="subtitle1" className="friends-section-title">
                            Partecipanti alle tue attività
                        </Typography>

                        {joinNotifications.length === 0 ? (
                            <Typography color="text.secondary" className="requests-empty">
                                Nessun partecipante al momento.
                            </Typography>
                        ) : (
                            <List className="notifications-list">
                                {joinNotifications
                                    .filter((n) => n.actor)
                                    .map((n) => (
                                    <ListItem
                                        key={n._id}
                                        className="notification-item"
                                        onClick={() => navigate(`/users/${n.actor._id}`)}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={n.actor.profilePicture || undefined}>
                                                {n.actor.nickname.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={n.actor.nickname}
                                            secondary={`ha aderito a "${n.post?.title}"`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}