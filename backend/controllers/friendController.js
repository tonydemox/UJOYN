const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) return res.status(200).json([]);

        const users = await User.find({
            nickname: { $regex: query, $options: 'i' },
            _id: { $ne: req.userId },
        })
            .select('nickname profilePicture')
            .limit(20);

        const results = await Promise.all(
            users.map(async (u) => {
                const friendship = await Friendship.findOne({
                    $or: [
                        { requester: req.userId, recipient: u._id },
                        { requester: u._id, recipient: req.userId },
                    ],
                });

                let status = 'none';
                if (friendship) {
                    status = friendship.status === 'accepted' ? 'accepted' : 'pending';
                }

                return {
                    id: u._id,
                    nickname: u.nickname,
                    profilePicture: u.profilePicture,
                    friendshipStatus: status,
                };
            })
        );

        res.status(200).json(results);
    } catch (error) {
        console.error('Errore ricerca utenti:', error);
        res.status(500).json({ message: 'Errore durante la ricerca', error: error.message });
    }
};

exports.sendRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId === req.userId) {
            return res.status(400).json({ message: 'Non puoi aggiungere te stesso' });
        }

        const existing = await Friendship.findOne({
            $or: [
                { requester: req.userId, recipient: userId },
                { requester: userId, recipient: req.userId },
            ],
        });
        if (existing) {
            return res.status(400).json({ message: 'Richiesta già esistente o già amici' });
        }

        const friendship = await Friendship.create({ requester: req.userId, recipient: userId });

        const notification = await Notification.create({
            recipient: userId,
            type: 'friend_request',
            actor: req.userId,
        });
        const populated = await notification.populate('actor', 'nickname profilePicture');
        req.app.get('io').to(userId).emit('new_notification', populated);

        res.status(201).json(friendship);
    } catch (error) {
        console.error('Errore invio richiesta:', error);
        res.status(500).json({ message: 'Errore durante l\'invio della richiesta', error: error.message });
    }
};

exports.removeRequest = async (req, res) => {
    try {
        const { userId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            $or: [
                { requester: req.userId, recipient: userId },
                { requester: userId, recipient: req.userId },
            ],
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Relazione non trovata' });
        }

        res.status(200).json({ message: 'Operazione completata' });
    } catch (error) {
        console.error('Errore rimozione:', error);
        res.status(500).json({ message: 'Errore durante la rimozione', error: error.message });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Richiesta non trovata' });
        if (friendship.recipient.toString() !== req.userId) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        friendship.status = 'accepted';
        await friendship.save();

        const notification = await Notification.create({
            recipient: friendship.requester,
            type: 'friend_accept',
            actor: req.userId,
        });
        const populated = await notification.populate('actor', 'nickname profilePicture');
        req.app.get('io').to(friendship.requester.toString()).emit('new_notification', populated);

        req.app.get('io').to(friendship.requester.toString()).emit('friends_count_updated');
        req.app.get('io').to(req.userId).emit('friends_count_updated');

        res.status(200).json(friendship);
    } catch (error) {
        console.error('Errore accettazione richiesta:', error);
        res.status(500).json({ message: 'Errore durante l\'accettazione', error: error.message });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await Friendship.find({ recipient: req.userId, status: 'pending' })
            .populate('requester', 'nickname profilePicture');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero delle richieste', error: error.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const friendship = await Friendship.findById(req.params.id);
        if (!friendship) return res.status(404).json({ message: 'Richiesta non trovata' });
        if (friendship.recipient.toString() !== req.userId) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        await Friendship.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Richiesta rifiutata' });
    } catch (error) {
        console.error('Errore rifiuto richiesta:', error);
        res.status(500).json({ message: 'Errore durante il rifiuto', error: error.message });
    }
};

exports.removeFriend = async (req, res) => {
    try {
        const { userId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            status: 'accepted',
            $or: [
                { requester: req.userId, recipient: userId },
                { requester: userId, recipient: req.userId },
            ],
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Amicizia non trovata' });
        }

        res.status(200).json({ message: 'Amico rimosso con successo' });
    } catch (error) {
        console.error('Errore rimozione amico:', error);
        res.status(500).json({ message: 'Errore durante la rimozione', error: error.message });
    }
};

exports.getFriendsList = async (req, res) => {
    try {
        const {userId} = req.params;

        const friendships = await Friendship.find({
            status: 'accepted',
            $or: [
                {requester: req.userId},
                {recipient: req.userId},
            ],
        })
            .populate('requester', 'nickname profilePicture')
            .populate('recipient', 'nickname profilePicture')
            .sort({createdAt: -1});

        const friends = friendships.map((f) => {
            const isRequester = f.requester._id.toString() === userId;
            return isRequester ? f.recipient : f.requester;
        });

        res.status(200).json(friends);
    } catch (error) {
        console.error('Errore recupero lista amici:', error);
        res.status(500).json({ message: 'Errore nel recupero degli amici', error: error.message });
    }
};