import { useState, useEffect } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Card, CardContent, Typography, Button, Chip, CircularProgress, Avatar } from '@mui/material';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';
import './FeedPage.css';

export default function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user, refreshUser } = useAuth();

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance
            .get('/posts/feed')
            .then(({ data }) => setPosts(data))
            .finally(() => setIsLoading(false));
    }, []);

    async function handleJoin(postId) {
        try {
            await axiosInstance.post(`/posts/${postId}/join`);
            setPosts((prev) =>
                prev.map((p) => (p._id === postId ? { ...p, participants: [...p.participants, user.id] } : p))
            );
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante l\'adesione');
        }
    }

    async function handleLeave(postId){
        try {
            await axiosInstance.post(`/posts/${postId}/leave`);
            setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, participants: p.participants.filter((id) => id !== user.id) }
            : p
            )
            );
            refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || 'Errore durante la rimozione');
        }
    }
        return (
            <div className="feed-page">
                <Container fluid className="feed-container">
                    <Row className="feed-header-row align-items-center mb-4">
                        <Col>
                            <Typography variant="h4" className="feed-title">Attività vicino a te</Typography>
                        </Col>

                    {isLoading ? (
                        <div className="feed-loading"><CircularProgress /></div>
                    ) : posts.length === 0 ? (
                        <Typography color="text.secondary" className="feed-empty">
                            Nessuna attività compatibile trovata al momento.
                        </Typography>
                    ) : (
                        <Row className="g-4">
                            {posts.map((post) => {
                                const hasJoined = post.participants.includes(user.id);
                                return (
                                    <Col key={post._id} xs={12} sm={6} lg={4}>
                                        <Card className="feed-card bubble-card" variant="outlined">
                                            <CardContent>
                                                <Chip label={post.category} size="small" className="feed-card-chip" />
                                                <Typography variant="h6" className="feed-card-title">{post.title}</Typography>
                                                <Typography variant="body2" color="text.secondary" className="feed-card-meta">
                                                    {new Date(post.date).toLocaleDateString('it-IT')} · {new Date(post.date).toLocaleTimeString('it-IT')} · {post.city.name}
                                                </Typography>
                                                <Typography variant="body2" className="feed-card-description">
                                                    {post.description}
                                                </Typography>

                                                <div
                                                    className="feed-card-author"
                                                    onClick={() => navigate(`/users/${post.author._id}`)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <Avatar
                                                        src={post.author.profilePicture || undefined}
                                                        className="feed-card-avatar"
                                                    >
                                                        {post.author.nickname.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {post.author.nickname}
                                                    </Typography>
                                                </div>

                                                <Button
                                                    onClick={() => (hasJoined ? handleLeave(post._id) : handleJoin(post._id))}
                                                    variant={hasJoined ? 'outlined' : 'contained'}
                                                    fullWidth
                                                    className="feed-card-join"
                                                >
                                                    {hasJoined ? 'Annulla partecipazione' : 'Partecipa'}
                                                </Button>

                                            </CardContent>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                        )}
                    </Row>
                </Container>
            </div>
        );
}