// src/pages/GalleryPage.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {Typography, CircularProgress, IconButton} from '@mui/material';
import axiosInstance from '../api/axiosInstance';
import { useSocket } from '../socket/SocketContext';
import './GalleryPage.css';
import { useNavigate } from "react-router-dom";
import {ChevronLeft, ChevronRight, Close} from "@mui/icons-material";

export default function GalleryPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
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
        function handleNewPhoto({ postId, photo }) {
            setPosts((prev) => {
                const idx = prev.findIndex((p) => p._id === postId);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = { ...updated[idx], photos: [...updated[idx].photos, photo] };
                return updated;
            });
        }
        socket.on('new_photo', handleNewPhoto);
        return () => socket.off('new_photo', handleNewPhoto);
    }, [socket]);

    const allPhotos = posts.flatMap((post) =>
        post.photos.map((photo) => ({ ...photo, postTitle: post.title, postId: post._id,  uploadedByNickname: photo.uploadedBy?.nickname || 'Utente', uploadedById: photo.uploadedBy?._id,}))
    );

    function handlePrev(e) {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    }

    function handleNext(e) {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % allPhotos.length);
    }

    useEffect(() => {
        if (selectedIndex === null) return;
        function handleKeyDown(e) {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') setSelectedIndex(null);
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, allPhotos.length]);

    const currentPhoto = selectedIndex !== null ? allPhotos[selectedIndex] : null;

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
                                <div className="gallery-item bubble-card" onClick={() => setSelectedIndex(i)}>
                                    <img src={`${photo.url}`} alt={photo.postTitle}/>
                                    <div className="gallery-item-caption">
                                        <span className="gallery-item-title">{photo.postTitle}</span>
                                        <span
                                            className="gallery-item-author"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/users/${photo.uploadedById}`);
                                            }}
                                        >
                      di {photo.uploadedByNickname}
                    </span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            {currentPhoto && (
                <div className="photo-lightbox" onClick={() => setSelectedIndex(null)}>
                    <IconButton className="photo-lightbox-close" onClick={() => setSelectedIndex(null)} aria-label="Chiudi">
                        <Close />
                    </IconButton>

                    <IconButton className="photo-lightbox-prev" onClick={handlePrev} aria-label="Precedente">
                        <ChevronLeft />
                    </IconButton>

                    <img
                        src={currentPhoto.url}
                        alt={currentPhoto.postTitle}
                        className="photo-lightbox-image"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <IconButton className="photo-lightbox-next" onClick={handleNext} aria-label="Successiva">
                        <ChevronRight />
                    </IconButton>

                    <div className="photo-lightbox-caption" onClick={(e) => e.stopPropagation()}>
                        <Typography className="photo-lightbox-title">{currentPhoto.postTitle}</Typography>
                        <Typography
                            className="photo-lightbox-author"
                            onClick={() => navigate(`/users/${currentPhoto.uploadedById}`)}
                        >
                            di {currentPhoto.uploadedByNickname}
                        </Typography>
                    </div>
                </div>
            )}
        </div>
    );
}