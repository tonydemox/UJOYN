// src/pages/GalleryPage.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Typography, CircularProgress } from '@mui/material';
import axiosInstance from '../api/axiosInstance';
import { useSocket } from '../socket/SocketContext';
import './GalleryPage.css';
import { useNavigate } from "react-router-dom";

export default function GalleryPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    const navigate = useNavigate();

    useEffect(() => {
        axiosInstance
            .get('/posts/gallery')
            .then(({ data }) => setPosts(data))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (!socket) return;

        function handleNewPhoto({ postId, postTitle, photo }) {
            setPosts((prev) => {
                const existingPostIndex = prev.findIndex((p) => p._id === postId);
                if (existingPostIndex === -1) return prev;
                const updated = [...prev];
                updated[existingPostIndex] = {
                    ...updated[existingPostIndex],
                    photos: [...updated[existingPostIndex].photos, photo],
                };
                return updated;
            });
        }

        socket.on('new_photo', handleNewPhoto);
        return () => socket.off('new_photo', handleNewPhoto);
    }, [socket]);

    const allPhotos = posts.flatMap((post) =>
        post.photos.map((photo) => ({ ...photo, postTitle: post.title, postId: post._id,  uploadedByNickname: photo.uploadedBy?.nickname || 'Utente',}))
    );

    return (
        <div className="gallery-page">
            <Container fluid className="gallery-container">


                {isLoading ? (
                    <div className="gallery-loading"><CircularProgress /></div>
                ) : allPhotos.length === 0 ? (
                    <Typography color="text.secondary" className="gallery-empty">
                        Nessuna foto disponibile al momento.
                    </Typography>
                ) : (
                    <Row className="g-3">
                        {allPhotos.map((photo, i) => (
                            <Col key={i} xs={6} sm={4} md={3} lg={2}>
                                <div className="gallery-item">
                                    <img src={`${photo.url}`} alt={photo.postTitle} />
                                    <div className="gallery-item-caption">
                                        <span className="gallery-item-title">{photo.postTitle}</span>
                                        <span className="gallery-item-author"
                                              onClick={() => navigate(`/users/${photo.uploadedBy._id}`)}>di {photo.uploadedByNickname}</span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
}