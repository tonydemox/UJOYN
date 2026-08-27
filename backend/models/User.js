const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        nickname: {
            type: String,
            required: true,
            trim: true,
            unique:true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () { return !this.googleId; },
            select: false,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        isProfileComplete: {
            type: Boolean,
            default: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        coverPhoto: {
            type: String,
            default: null,
        },
        birthDate: {
            type: Date,
            required: true,
        },
        hobbies: {
            type: [String],
            default: [],
        },
        city: {
            name: {
                type: String,
                required: true,
            },
            province: {
                type: String,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        refreshTokens: {
            type: [String],
            default: [],
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', function () {
    if (this.isModified('city.coordinates')) {
        this.location = {
            type: 'Point',
            coordinates: this.city.coordinates,
        };
    }
    });

userSchema.index({ location: '2dsphere'});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('age').get(function () {
    if (!this.birthDate) return null; // aggiunto: evita il crash quando birthDate non è caricato
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
        age--;
    }
    return age;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
