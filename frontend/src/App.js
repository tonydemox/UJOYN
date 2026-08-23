// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import FeedPage from './pages/FeedPage';
import GalleryPage from './pages/GalleryPage';
import CreatePostPage from './pages/CreatePostPage';
import FriendsPage from './pages/FriendsPage';
import UpdatePostPage from './pages/UpdatePostPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ParticipantsPage from './pages/ParticipantsPage';
import { SocketProvider } from './socket/SocketContext';

function HomeRedirect() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <p>Caricamento...</p>;
    return <Navigate to={user ? '/feed' : '/login'} replace />;
}

function AppLayout({ children }) {
    const { user } = useAuth();
    return (
        <div className="main-app-wrapper">
            <div className="app-layout">
                {user && <Sidebar />}
                <div className="app-content">{children}</div>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                <AppLayout>
                    <Routes>
                        <Route path="/" element={<HomeRedirect />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                        <Route path="/profile/edit" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
                        <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
                        <Route path="/gallery" element={<PrivateRoute><GalleryPage /></PrivateRoute>} />
                        <Route path="/posts/new" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
                        <Route path="/friends" element={<PrivateRoute><FriendsPage /></PrivateRoute>} />
                        <Route path="/posts/:id/edit" element={<PrivateRoute><UpdatePostPage /></PrivateRoute>} />
                        <Route path="/users/:id" element={<PrivateRoute><PublicProfilePage /></PrivateRoute>} />
                        <Route path="/participants/:id" element={<PrivateRoute><ParticipantsPage /></PrivateRoute>} />
                    </Routes>
                </AppLayout>
                </SocketProvider>
            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;