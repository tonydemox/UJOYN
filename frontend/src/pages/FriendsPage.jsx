import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import {Card, CardContent, Typography, Avatar, Button, CircularProgress, List, ListItem, ListItemAvatar, ListItemText, } from '@mui/material';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';
import './FriendsPage.css';

export default function FriendsPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const [receivedRequests, setReceivedRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRequests = useCallback(() => {
        axiosInstance.get('/friends/requests').then(({ data }) => setReceivedRequests(data));
    }, []);

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
                            <Row className="g-3">
                                {receivedRequests.map((request) => (
                                    <Col key={request._id} xs={12} sm={6} lg={4}>
                                        <Card className="friends-card bubble-card" variant="outlined">
                                            <CardContent className="friends-card-content">
                                                <div
                                                    className="friends-card-clickable"
                                                    onClick={() => navigate(`/users/${request.requester._id}`)}
                                                >
                                                    <Avatar
                                                        src={request.requester.profilePicture || undefined}
                                                        className="friends-card-avatar"
                                                    >
                                                        {request.requester.nickname.charAt(0).toUpperCase()}
                                                    </Avatar>

                                                    <Typography className="friends-card-nickname">
                                                        {request.requester.nickname}
                                                    </Typography>
                                                </div>

                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={() => handleAccept(request._id)}
                                                    className="friends-card-accept"
                                                >
                                                    Accetta
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={() => handleRemove(request._id)}
                                                    className="friends-card-reject"
                                                >
                                                    Rifiuta
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </CardContent>
                </Card>


                <Card className="friends-main-card bubble-card" variant="outlined" style={{ marginTop: 24 }}>
                    <CardContent>
                        <Typography variant="subtitle1" className="friends-section-title">
                            Partecipazioni alle tue attività
                        </Typography>

                        {notifications.length === 0 ? (
                            <Typography color="text.secondary" className="requests-empty">
                                Nessuna notifica al momento.
                            </Typography>
                        ) : (
                            <List className="notifications-list">
                                {notifications.map((n) => (
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
                                            primary={
                                                n.type === 'post_join'
                                                    ? `${n.actor.nickname} ha aderito a "${n.post?.title}"`
                                                    : n.type === 'friend_request'
                                                        ? `${n.actor.nickname} ti ha inviato una richiesta di amicizia`
                                                        : `${n.actor.nickname} ha accettato la tua richiesta di amicizia`
                                            }
                                            secondary={new Date(n.createdAt).toLocaleString('it-IT')}
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