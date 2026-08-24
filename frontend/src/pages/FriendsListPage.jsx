import { useState, useEffect } from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosInstance from "../api/axiosInstance";
import {Avatar, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Typography} from "@mui/material";
import './ParticipantsPage.css';

export default function FriendsListPage() {
    const [myFriends, setMyFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { id } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance
            .get(`/friends/list/${id}`)
            .then(({ data }) => setMyFriends(data))
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return <Typography className="profile-loading">Caricamento amici...</Typography>;

    return (
        <div className="participants-page">
            <Container fluid className="participants-container">
                <Row>
                <Col>
                    <Typography variant="h4" className="gallery-title">Lista amici</Typography>
                </Col>
                </Row>
                <Card className="participants-main-card bubble-card" variant="outlined">
                    <CardContent>
                    {myFriends.length === 0 ? (
                        <Typography color="text.secondary" className="requests-empty">
                            Nessuna amico al momento.
                        </Typography>
                    ) : (
                        <List className="participants-list">
                            {myFriends.map((n) => (
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
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}
