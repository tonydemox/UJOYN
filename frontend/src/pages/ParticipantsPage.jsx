import { useState, useEffect } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosInstance from "../api/axiosInstance";
import {Avatar, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";
import './ParticipantsPage.css';

export default function ParticipantsPage() {
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { id } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance
            .get(`/posts/${id}/participants`)
            .then(({ data }) => setParticipants(data))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <Typography className="profile-loading">Caricamento partecipanti...</Typography>;

    return (
        <div className="participants-page">
            <Container fluid className="participants-container">
                    <Col>
                        <Typography variant="h4" className="gallery-title">Lista partecipanti</Typography>
                    </Col>
                <Card className="participants-main-card bubble-card" variant="outlined">
                    {participants.length === 0 ? (
                        <Typography color="text.secondary" className="requests-empty">
                            Nessuna partecipante al momento.
                        </Typography>
                        ) : (
                        <List className="participants-list">
                            {participants.map((n) => (
                                <ListItem
                                    key={n._id}
                                    className="participants-item"
                                    onClick={() => navigate(`/users/${n._id}`)}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={n.profilePicture || undefined}>
                                            {n.nickname.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={n.nickname || "Utente"}
                                    />
                                </ListItem>
                            ))}
                                </List>
                    )}
                </Card>
            </Container>
        </div>
    );
}