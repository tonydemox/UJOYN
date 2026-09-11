const City = require('../models/City');

exports.getAllCities = async (req, res) => {
    try {
        const cities = await City.find().sort({ name: 1 });
        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel recupero dei comuni', error: error.message });
    }
};