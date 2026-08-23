const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token di accesso mancante' });
    }

    const accessToken = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        req.userId = decoded.userId; 
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token scaduto', code: 'TOKEN_EXPIRED' });
        }
        return res.status(403).json({ message: 'Token non valido' });
    }
}

module.exports = verifyToken;

