const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Friendship = require('../models/Friendship');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateAccessToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
}

function generateRefreshToken(userId) {
    return jwt.sign( {userId}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
}

exports.register = async (req, res) => {
    try {
        const { nickname, email, password, birthDate, hobbies, city } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { nickname }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email o nickname già in uso' });
        }

        const user = await User.create({
            nickname,
            email,
            password,
            birthDate,
            hobbies,
            city,
        });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            user: {
                id: user._id,
                nickname: user.nickname,
                email: user.email,
                age: user.age,
                hobbies: user.hobbies,
                city: user.city,
                profilePicture: user.profilePicture,
                coverPhoto: user.coverPhoto,
            },
            accessToken,
        });

    } catch (error) {
        res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
    }
};

exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password +refreshTokens');
        if (!user) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshTokens.push(refreshToken);
        await user.save();

        const friendsCount = await Friendship.countDocuments({
            status: 'accepted',
            $or: [{ requester: user._id }, { recipient: user._id }],
        });
        const eventsCount = await Post.countDocuments({ participants: user._id });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            user: {
                id: user._id,
                nickname: user.nickname,
                email: user.email,
                age: user.age,
                hobbies: user.hobbies,
                city: user.city,
                profilePicture: user.profilePicture,
                coverPhoto: user.coverPhoto,
                friendsCount,
                eventsCount,
            },
            accessToken,
        });
    } catch (error) {
        res.status(500).json({ message: 'Errore durante il login', error: error.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ $or: [{ googleId }, { email }] }).select('+refreshTokens');
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = await User.create({
                googleId,
                email,
                nickname: name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
                profilePicture: picture,
                isProfileComplete: false,
                // birthDate, city, hobbies mancano: andranno completati dopo
            });
        } else if (!user.googleId) {
            // Utente esistente (registrato con email/password) che ora usa anche Google: colleghiamo l'account
            user.googleId = googleId;
            await user.save();
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const friendsCount = await Friendship.countDocuments({
            status: 'accepted',
            $or: [{ requester: user._id }, { recipient: user._id }],
        });
        const eventsCount = await Post.countDocuments({ participants: user._id });

        res.status(200).json({
            user: {
                id: user._id,
                nickname: user.nickname,
                email: user.email,
                age: user.age,
                hobbies: user.hobbies,
                city: user.city,
                profilePicture: user.profilePicture,
                coverPhoto: user.coverPhoto,
                isProfileComplete: user.isProfileComplete,
                friendsCount,
                eventsCount,
            },
            accessToken,
            isNewUser,
        });
    } catch (error) {
        console.error('Errore login Google:', error);
        res.status(500).json({ message: 'Errore durante l\'accesso con Google', error: error.message });
    }
};

exports.refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token mancante' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.userId).select('+refreshTokens');
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(403).json({ message: 'Refresh token non valido' });
        }

        const newAccessToken = generateAccessToken(user._id);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(403).json({ message: 'Refresh token scaduto o non valido' });
    }
};

exports.logout = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.decode(refreshToken);
            if (decoded?.userId) {
                await User.findByIdAndUpdate(decoded.userId, {
                    $pull: { refreshTokens: refreshToken },
                });
            }
        }

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logout effettuato' });
    }catch (error) {
        res.status(500).json({ message: 'Errore durante il logout', error: error.message });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato' });
        }

        const eventsCount = await Post.countDocuments({ participants: req.userId });
        const friendsCount = await Friendship.countDocuments({
            status: 'accepted',
            $or: [{ requester: req.userId }, { recipient: req.userId }],
        });

        res.status(200).json({
            id: user._id,
            nickname: user.nickname,
            email: user.email,
            profilePicture: user.profilePicture,
            coverPhoto: user.coverPhoto,
            age: user.age,
            hobbies: user.hobbies,
            city: user.city,
            eventsCount,
            friendsCount,
        });
    } catch (error) {
        console.error('Errore /me:', error);
        res.status(500).json({ message: 'Errore nel recupero del profilo', error: error.message });
    }
};


