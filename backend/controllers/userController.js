const User = require('../models/User');
const Friendship = require('../models/Friendship');
const Post = require('../models/Post');

exports.updateProfile = async (req, res) => {
    try {
        const { hobbies, city } = req.body;
        const updateData = {};

        if (hobbies) updateData.hobbies = JSON.parse(hobbies);
        if (city) {
            const parsedCity = JSON.parse(city);
            updateData.city = parsedCity;
            updateData.location = {
                type: 'Point',
                coordinates: parsedCity.coordinates,
            };
        }

        if (req.files?.profilePicture?.[0]) {
            updateData.profilePicture = req.files.profilePicture[0].path;
        }
        if (req.files?.coverPhoto?.[0]) {
            updateData.coverPhoto = req.files.coverPhoto[0].path;
        }

        const user = await User.findByIdAndUpdate(req.userId, updateData, {
            new: true,
            runValidators: true,
        });

        const friendsCount = await Friendship.countDocuments({
            status: 'accepted',
            $or: [{ requester: req.userId }, { recipient: req.userId }],
        });
        const eventsCount = await Post.countDocuments({ participants: req.userId });

        res.status(200).json({
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
        });
    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento del profilo', error: error.message });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({message: 'Utente non trovato'});

        const friendsCount = await Friendship.countDocuments({
            status: 'accepted',
            $or: [{requester: id}, {recipient: id}],
        });
        const eventsCount = await Post.countDocuments({participants: id});
        const myPosts = await Post.find({author: id}).sort({date: -1});

        const friendship = await Friendship.findOne({
            $or: [
                {requester: req.userId, recipient: id},
                {requester: id, recipient: req.userId},
            ],
        });

        let friendshipStatus = 'none';
        let friendshipId = null;
        let requestDirection = null;

        if (friendship) {
            friendshipId = friendship._id;
            if (friendship.status === 'accepted') {
                friendshipStatus = 'accepted';
            } else {
                friendshipStatus = 'pending';
                requestDirection = friendship.requester.toString() === req.userId ? 'sent' : 'received';
            }
        }

        res.status(200).json({
            id: user._id,
            nickname: user.nickname,
            age: user.age,
            hobbies: user.hobbies,
            city: user.city,
            profilePicture: user.profilePicture,
            coverPhoto: user.coverPhoto,
            friendsCount,
            eventsCount,
            postsCount: myPosts.length,
            posts: myPosts,
            friendshipStatus,
            friendshipId,
            requestDirection,
            isOwnProfile: id === req.userId,
        });
    } catch (error) {
        console.error('Errore recupero profilo pubblico:', error);
        res.status(500).json({message: 'Errore nel recupero del profilo', error: error.message});
    }
};