const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const cityRoutes = require('./routes/cityRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const friendRoutes = require('./routes/friendRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: ['http://localhost:3000', 'https://ujoyn.vercel.app'], credentials: true },
});


io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token mancante'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch {
        next(new Error('Token non valido'));
    }
});

io.on('connection', (socket) => {
    socket.join(socket.userId);
    console.log(`Utente connesso: ${socket.userId}`);

    socket.on('disconnect', () => {
        console.log(`Utente disconnesso: ${socket.userId}`);
    });
});

app.set('io', io);

app.use(cors({ origin: 'https://ujoyn.vercel.app', credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connesso a MongoDB');
        server.listen(PORT, () => {
            console.log(`Server in ascolto sulla porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Errore di connessione a MongoDB:', error.message);
    });