// src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { Explore, Person, People, Event, Settings, PhotoLibrary } from '@mui/icons-material';
import { Nav } from 'react-bootstrap';
import './Sidebar.css';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    if (!user) return null;

    const avatarUrl = user.profilePicture || null;

    const links = [
        { to: '/feed', label: 'Home', icon: <Explore /> },
        { to: '/gallery', label: 'Foto', icon: <PhotoLibrary /> },
        { to: '/friends', label: 'Amici', icon: <People /> },
        { to: '/posts/new', label: 'Crea Evento', icon: <Event /> },
        { to: '/profile', label: 'Profilo', icon: <Person /> },
        { to: '/settings', label: 'Impostazioni', icon: <Settings />, disabled: true },
    ];

    return (
        <div className="sidebar-wrapper">
            <div className="sidebar-card bubble-card">
                <div className="sidebar-brand">poisivede10</div>

                <Nav className="flex-column sidebar-nav">
                    {links.map((link) => (
                        <Nav.Link
                            key={link.to}
                            as={link.disabled ? 'span' : Link}
                            to={link.disabled ? undefined : link.to}
                            className={`sidebar-link ${location.pathname === link.to ? 'active' : ''} ${link.disabled ? 'disabled' : ''}`}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Nav.Link>
                    ))}
                </Nav>

                <div className="sidebar-footer">
                    <div className="d-flex align-items-center gap-2 mb-2 sidebar-user-info">
                        <Avatar src={avatarUrl} className="sidebar-avatar">
                            {!avatarUrl && user?.nickname?.charAt(0).toUpperCase()}
                        </Avatar>
                        <div className="sidebar-user-text">
                            <p className="mb-0 fw-semibold small">{user?.nickname}</p>
                            <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-sm w-100 btn-outline-secondary" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}