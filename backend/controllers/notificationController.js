const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({recipient: req.userId})
            .populate('actor', 'nickname profilePicture')
            .populate('post', 'title')
            .sort({createdAt: -1})
            .limit(30);

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero delle notifiche', error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.status(200).json({ message: 'Notifica letta' });
    } catch (error) {
        res.status(500).json({ message: 'Errore', error: error.message });
    }
};