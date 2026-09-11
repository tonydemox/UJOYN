// backend/scripts/cleanupAll.js
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Post = require('../models/Post');
require('dotenv').config();

async function cleanupAll() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connesso a MongoDB');

    // Elimina le immagini da Cloudinary
    await cloudinary.api.delete_resources_by_prefix('poisivede10/avatars');
    await cloudinary.api.delete_resources_by_prefix('poisivede10/covers');
    await cloudinary.api.delete_resources_by_prefix('poisivede10/post-photos');
    console.log('Immagini Cloudinary eliminate');

    // Ripulisci i riferimenti nel database
    await User.updateMany({}, { profilePicture: null, coverPhoto: null });
    await Post.updateMany({}, { $set: { photos: [] } });
    console.log('Riferimenti database ripuliti');

    mongoose.disconnect();
}

cleanupAll().catch((error) => {
    console.error('ERRORE COMPLETO:', error);
    process.exit(1);
});