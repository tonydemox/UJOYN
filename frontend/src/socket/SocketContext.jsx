import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import { getAccessToken } from '../auth/tokenStore';
import { useAuth } from '../auth/AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, refreshUser } = useAuth();
    const socketRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null); // aggiunto: esponi il socket stesso

    useEffect(() => {
        if (!user) return;

        const token = getAccessToken();
        const s = socketIO('http://localhost:5000', { auth: { token } });

        s.on('new_notification', (notification) => {
            setNotifications((prev) => [notification, ...prev]);
        });

        s.on('friends_count_updated', () => {
            refreshUser();
        });

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
            setSocket(null);
        };
    }, [user, refreshUser]);

    return (
        <SocketContext.Provider value={{ notifications, setNotifications, socket }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}