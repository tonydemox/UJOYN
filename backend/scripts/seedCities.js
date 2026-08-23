const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const City = require('../models/City');

function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}

async function seedCities() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connesso a MongoDB per il seed');

    await City.deleteMany({});
    console.log('Collection cities svuotata');

    const comuni = await readCsv(path.join(__dirname, '../data/comuni.csv'));
    const coordinate = await readCsv(path.join(__dirname, '../data/coordinate.csv'));

    const coordMap = new Map();
    coordinate.forEach((row) => {
        const key = row.pro_com_t.replace(/^0+/, '');
        coordMap.set(key, { lat: parseFloat(row.lat), lng: parseFloat(row.long) });
    });

    const cities = comuni
        .map((row) => {
            const key = row.pro_com_t.replace(/^0+/, '');
            const coords = coordMap.get(key);
            if (!coords) return null;
            return {
                name: row.comune,
                province: row.sigla,
                region: row.den_reg,
                lat: coords.lat,
                lng: coords.lng,
            };
        })
        .filter(Boolean);

    console.log(`Comuni totali nel file: ${comuni.length}`);
    console.log(`Comuni con coordinate trovate: ${cities.length}`);

    await City.insertMany(cities);
    console.log(`Inseriti ${cities.length} comuni nel database`);
    mongoose.disconnect();
}

seedCities().catch((error) => {
    console.error('Errore durante il seed:', error.message);
    mongoose.disconnect();
});