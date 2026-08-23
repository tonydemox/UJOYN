const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

exports.createPost = async (req, res) => {
    try {
        const { title, description, category, date, minAge, maxAge, city } = req.body;

        const post = await Post.create({
            author: req.userId,
            title,
            description,
            category,
            date,
            minAge,
            maxAge,
            city,
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Errore creazione post:', error);
        res.status(500).json({ message: 'Errore durante la creazione del post', error: error.message });
    }
};

exports.getCompatiblePosts = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Utente non trovato' });

        const userAge = calculateAge(user.birthDate);
        const maxDistanceKm = 30;

        const posts = await Post.find({
            status: 'upcoming',
            date: { $gte: new Date() },
            author: { $ne: req.userId },
            category: { $in: user.hobbies },
            minAge: { $lte: userAge },
            maxAge: { $gte: userAge },
            location: {
                $near: {
                    $geometry: user.location,
                    $maxDistance: maxDistanceKm * 1000,
                },
            },
        })
            .populate('author', 'nickname profilePicture')
            .sort({ date: 1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Errore recupero post compatibili:', error);
        res.status(500).json({ message: 'Errore nel recupero delle attività', error: error.message });
    }
};

exports.getCompletedPostsWithPhotos = async (req, res) => {
    try {
        const posts = await Post.find({
            date: { $lt: new Date() },
            'photos.0': { $exists: true },
        })
        .populate('author', 'nickname profilePicture')
        .populate('photos.uploadedBy', 'nickname')
        .sort({ date: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Errore recupero foto attività:', error);
        res.status(500).json({ message: 'Errore nel recupero delle foto', error: error.message });
    }
};

exports.joinPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Attività non trovata' });

        if (post.participants.includes(req.userId)) {
            return res.status(400).json({ message: 'Hai già aderito a questa attività' });
        }

        post.participants.push(req.userId);
        await post.save();

        if (post.author.toString() !== req.userId) {
            try {
                const notification = await Notification.create({
                    recipient: post.author,
                    type: 'post_join',
                    actor: req.userId,
                    post: post._id,
                });
                const populated = await notification.populate('actor', 'nickname profilePicture');
                const io = req.app.get('io');
                if (io) io.to(post.author.toString()).emit('new_notification', populated);
            } catch (notifError) {
                console.error('Errore creazione notifica (non bloccante):', notifError);
            }
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Errore durante l\'adesione:', error);
        res.status(500).json({ message: 'Errore durante l\'adesione', error: error.message });
    }
};

exports.leavePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Attività non trovata'});

        if (!post.participants.includes(req.userId)) {
            return res.status(400).json({ message: 'Non hai aderito a questa attività'});
        }

        post.participants = post.participants.filter((p) => p.toString() !== req.userId);
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Errore durante la rimozione', error: error.message });
    }
}

exports.getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.userId }).sort({ date: -1});
        res.status(200).json(posts);
    }catch (error) {
        console.error('Errore recupero miei post:', error);
        res.status(500).json({ message: 'Errore nel recupero post', error: error.message });
    }
};

exports.getMyPhotos = async (req, res) => {
    try {
        const posts = await Post.find({ 'photos.uploadedBy': req.userId });
        const photos = posts.flatMap((post) =>
            post.photos
                .filter((photo) => photo.uploadedBy?.toString() === req.userId)
                .map((photo) => ({
                    _id: photo._id,
                    url: photo.url,
                    uploadedAt: photo.uploadedAt,
                    postTitle: post.title,
                    postId: post._id,
                }))
        );
        res.status(200).json(photos);
    } catch (error) {
        console.error('Errore recupero mie foto', error);
        res.status(500).json({ message: 'Errore nel recupero delle foto', error: error.message});
    }
};

exports.updateMyPost = async (req, res) => {
    try {
        const { id } = req.params;
        const {title, description, category, date, minAge, maxAge, city, status} = req.body;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Attività non trovata' });

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Non autorizzato a modificare questa attività' });
        }

        if (post.status !== 'upcoming') {
            return res.status(400).json({ message: 'Non puoi modificare un\'attività non più in programma' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category.trim().toLowerCase();
        if (date) updateData.date = date;
        if (minAge !== undefined) updateData.minAge = minAge;
        if (maxAge !== undefined) updateData.maxAge = maxAge;
        if (city) updateData.city = city;

        const updatePost = await Post.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(updatePost);
    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
        res.status(500).json({ message: 'Errore durante l\'aggiornamento del post', error: error.message });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'nickname profilePicture');
        if (!post) return res.status(404).json({ message: 'Attività non trovata' });
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dell\'attività', error: error.message });
    }
};

exports.deleteMyPost = async (req, res) => {
    try {
        const {id} = req.params;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({message: 'Attività non trovata'});
        if (post.author.toString() !== req.userId) {
            return res.status(403).json({message: 'Non autorizzato a eliminare questa attività'});
        }

        await Post.findByIdAndDelete(id);

        res.status(200).json({message: 'Attività eliminata con successo'});
    } catch (error) {
        console.error('Errore eliminazione post:', error);
        res.status(500).json({ message: 'Errore durante l\'eliminazione del post', error: error.message });
    }
};

exports.getJoinedPost = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Utente non trovato' });

        const posts = await Post.find({
            participants: req.userId,
        })
            .populate('author', 'nickname profilePicture')
            .populate('participants', 'nickname profilePicture')
            .sort({ date: -1 })
        res.status(200).json(posts);
    } catch(error) {
        console.error('Errore caricamento post:', error);
        res.status(500).json({ message: 'Errore durante il caricamento dei post', error: error.message });
    }
}

exports.getPostParticipants = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id).populate('participants', 'nickname profilePicture');
        if (!post) return res.status(404).json({ message: 'Attività non trovata' });

        if (post.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        res.status(200).json(post.participants);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei partecipanti', error: error.message });
    }
};

exports.uploadPostPhoto = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({message: 'Attività non trovata'});

        const isAuthor = post.author.toString() === req.userId;
        const isParticipant = post.participants.some((p) => p.toString() === req.userId);

        if (!isAuthor && !isParticipant) {
            return res.status(403).json({message: 'Non puoi postare foto relative a questa attività'});
        }

        if (post.date > new Date()) {
            return res.status(400).json({message: 'Puoi caricare foto solo dopo lo svolgimento dell\'attività'});
        }

        if (!req.file) {
            return res.status(400).json({message: 'Nessun file caricato'});
        }

        const newPhoto = {
            url: req.file.path,
            uploadedBy: req.userId,
            uploadedAt: new Date(),
        };

        post.photos.push({
            url: req.file.path,
            uploadedBy: req.userId,
        });
        await post.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('new_photo', {
                postId: post._id,
                postTitle: post.title,
                photo: newPhoto,
            });
        }

        res.status(201).json(post);
    } catch (error) {
        console.error('Errore caricamento foto:', error);
        res.status(500).json({ message: 'Errore durante il caricamento della foto', error: error.message });
    }
};

exports.deletePhoto = async (req, res) => {
    try {
        const { id, photoId } = req.params;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Attività non trovata' });

        const photo = post.photos.id(photoId);
        if (!photo) return res.status(404).json({ message: 'Foto non trovata' });

        const isUploader = photo.uploadedBy.toString() === req.userId;
        const isAuthor = post.author.toString() === req.userId;

        if (!isUploader && !isAuthor) {
            return res.status(403).json({ message: 'Non autorizzato' });
        }

        photo.deleteOne();
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        console.error('Errore eliminazione foto:', error);
        res.status(500).json({message: 'Errore durante la eliminazione della foto', error: error.message});
    }
};